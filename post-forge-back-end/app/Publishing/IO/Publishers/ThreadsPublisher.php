<?php

declare(strict_types=1);

namespace App\Publishing\IO\Publishers;

use App\Posts\Entities\Models\Post;
use App\SocialAccounts\Entities\Models\SocialAccount;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Sleep;
use RuntimeException;

final readonly class ThreadsPublisher implements PlatformPublisher
{
    private const BASE_URL = 'https://graph.threads.net';

    public function __construct(
        private SocialAccountRepository $socialAccountRepository,
    ) {}

    public function publish(Post $post, SocialAccount $account): string
    {
        $this->refreshTokenIfNeeded($account);
        $apiVersion = config('social-platforms.threads.api_version', 'v1.0');
        $userId = $account->platform_user_id;
        $accessToken = $account->access_token;
        $text = $this->buildText($post);

        // Step 1: Create a media container
        $createResponse = Http::post(
            self::BASE_URL . "/{$apiVersion}/{$userId}/threads",
            [
                'media_type' => 'TEXT',
                'text' => $text,
                'access_token' => $accessToken,
            ]
        );

        if (! $createResponse->successful()) {
            $error = $createResponse->json('error.message', 'Unknown error creating Threads media container');
            throw new RuntimeException("Threads API error (create): {$error}");
        }

        $creationId = $createResponse->json('id');

        if (! $creationId) {
            throw new RuntimeException('Threads API did not return a creation ID');
        }

        // Wait for the media container to be ready
        $this->waitForContainerReady($apiVersion, $creationId, $accessToken);

        // Step 2: Publish the media container
        $publishResponse = Http::post(
            self::BASE_URL . "/{$apiVersion}/{$userId}/threads_publish",
            [
                'creation_id' => $creationId,
                'access_token' => $accessToken,
            ]
        );

        if (! $publishResponse->successful()) {
            $error = $publishResponse->json('error.message', 'Unknown error publishing Threads post');
            throw new RuntimeException("Threads API error (publish): {$error}");
        }

        $postId = $publishResponse->json('id');

        if (! $postId) {
            throw new RuntimeException('Threads API did not return a post ID');
        }

        return (string) $postId;
    }

    /**
     * @return array{data: array<int, array<string, mixed>>, paging?: array<string, mixed>}
     */
    public function fetchThreads(SocialAccount $account, ?string $after = null, int $limit = 25): array
    {
        $this->refreshTokenIfNeeded($account);
        $apiVersion = config('social-platforms.threads.api_version', 'v1.0');
        $userId = $account->platform_user_id;
        $accessToken = $account->access_token;

        $params = [
            'fields' => 'id,text,timestamp,permalink,media_type,media_url,thumbnail_url',
            'limit' => $limit,
            'access_token' => $accessToken,
        ];

        if ($after !== null) {
            $params['after'] = $after;
        }

        $response = Http::get(
            self::BASE_URL . "/{$apiVersion}/{$userId}/threads",
            $params
        );

        if (! $response->successful()) {
            $error = $response->json('error.message', 'Unknown error fetching Threads posts');
            throw new RuntimeException("Threads API error (fetch): {$error}");
        }

        return $response->json();
    }

    /**
     * Fetch per-post insights from the Threads API.
     *
     * @return array{views: int, likes: int, replies: int, reposts: int, quotes: int}
     */
    public function fetchPostInsights(string $mediaId, SocialAccount $account): array
    {
        $this->refreshTokenIfNeeded($account);
        $apiVersion = config('social-platforms.threads.api_version', 'v1.0');
        $accessToken = $account->access_token;

        $response = Http::get(
            self::BASE_URL . "/{$apiVersion}/{$mediaId}/insights",
            [
                'metric' => 'views,likes,replies,reposts,quotes',
                'access_token' => $accessToken,
            ]
        );

        if (! $response->successful()) {
            $error = $response->json('error.message', 'Unknown error fetching Threads post insights');
            throw new RuntimeException("Threads API error (post insights): {$error}");
        }

        return $this->parsePostInsights($response->json('data', []));
    }

    /**
     * Fetch user-level aggregated insights from the Threads API.
     *
     * @return array{views: int, likes: int, replies: int, reposts: int, quotes: int}
     */
    public function fetchUserInsights(SocialAccount $account, string $since, string $until): array
    {
        $this->refreshTokenIfNeeded($account);
        $apiVersion = config('social-platforms.threads.api_version', 'v1.0');
        $userId = $account->platform_user_id;
        $accessToken = $account->access_token;

        $response = Http::get(
            self::BASE_URL . "/{$apiVersion}/{$userId}/threads_insights",
            [
                'metric' => 'views,likes,replies,reposts,quotes',
                'since' => $since,
                'until' => $until,
                'access_token' => $accessToken,
            ]
        );

        if (! $response->successful()) {
            $error = $response->json('error.message', 'Unknown error fetching Threads user insights');
            throw new RuntimeException("Threads API error (user insights): {$error}");
        }

        return $this->parseUserInsights($response->json('data', []));
    }

    /**
     * Parse post-level insights: data[].name + data[].values[0].value
     */
    private function parsePostInsights(array $data): array
    {
        $metrics = ['views' => 0, 'likes' => 0, 'replies' => 0, 'reposts' => 0, 'quotes' => 0];

        foreach ($data as $item) {
            $name = $item['name'] ?? null;
            if ($name !== null && array_key_exists($name, $metrics)) {
                $metrics[$name] = (int) ($item['values'][0]['value'] ?? 0);
            }
        }

        return $metrics;
    }

    /**
     * Parse user-level insights: data[].name + data[].total_value.value
     */
    private function parseUserInsights(array $data): array
    {
        $metrics = ['views' => 0, 'likes' => 0, 'replies' => 0, 'reposts' => 0, 'quotes' => 0];

        foreach ($data as $item) {
            $name = $item['name'] ?? null;
            if ($name !== null && array_key_exists($name, $metrics)) {
                $metrics[$name] = (int) ($item['total_value']['value'] ?? 0);
            }
        }

        return $metrics;
    }

    public function delete(string $platformPostId, SocialAccount $account): void
    {
        $this->refreshTokenIfNeeded($account);
        $apiVersion = config('social-platforms.threads.api_version', 'v1.0');
        $accessToken = $account->access_token;

        $response = Http::delete(
            self::BASE_URL . "/{$apiVersion}/{$platformPostId}?access_token={$accessToken}"
        );

        if (! $response->successful()) {
            $error = $response->json('error.message', 'Unknown error deleting Threads post');
            throw new RuntimeException("Threads API error (delete): {$error}");
        }
    }

    /**
     * Refresh the Threads long-lived token if it's about to expire.
     *
     * Threads long-lived tokens last ~60 days and can be refreshed as long as
     * they are at least 24 hours old and not yet expired.
     */
    private function refreshTokenIfNeeded(SocialAccount $account): void
    {
        if (! $account->needsReconnect(withinMinutes: 60 * 24 * 7)) {
            return; // More than 7 days left, no need to refresh
        }

        $response = Http::get(self::BASE_URL . '/refresh_access_token', [
            'grant_type' => 'th_refresh_token',
            'access_token' => $account->access_token,
        ]);

        if (! $response->successful()) {
            Log::warning('Threads token refresh failed', [
                'error' => $response->json('error.message', 'Unknown error'),
                'account_id' => $account->id,
            ]);

            return;
        }

        $expiresIn = $response->json('expires_in');

        $this->socialAccountRepository->updateTokens(
            $account->id,
            $response->json('access_token'),
            null,
            $expiresIn !== null ? now()->addSeconds($expiresIn) : null,
        );

        // Update the in-memory model so callers see fresh tokens
        $account->access_token = $response->json('access_token');
        if ($expiresIn !== null) {
            $account->token_expires_at = now()->addSeconds($expiresIn);
        }
    }

    private function waitForContainerReady(string $apiVersion, string $containerId, string $accessToken): void
    {
        $maxAttempts = 10;

        for ($i = 0; $i < $maxAttempts; $i++) {
            $response = Http::get(
                self::BASE_URL . "/{$apiVersion}/{$containerId}",
                [
                    'fields' => 'status',
                    'access_token' => $accessToken,
                ]
            );

            $status = $response->json('status');

            if ($status === 'FINISHED') {
                return;
            }

            if ($status === 'ERROR') {
                throw new RuntimeException('Threads media container failed processing');
            }

            Sleep::for(2)->seconds();
        }

        throw new RuntimeException('Threads media container did not become ready in time');
    }

    private function buildText(Post $post): string
    {
        $parts = [$post->content];

        $hashtags = $post->hashtags ?? [];
        if ($hashtags !== []) {
            $parts[] = implode(' ', array_map(
                fn (string $tag) => str_starts_with($tag, '#') ? $tag : "#{$tag}",
                $hashtags
            ));
        }

        $mentions = $post->mentions ?? [];
        if ($mentions !== []) {
            $parts[] = implode(' ', array_map(
                fn (string $mention) => str_starts_with($mention, '@') ? $mention : "@{$mention}",
                $mentions
            ));
        }

        return implode("\n\n", $parts);
    }
}
