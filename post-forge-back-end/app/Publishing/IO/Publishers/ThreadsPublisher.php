<?php

declare(strict_types=1);

namespace App\Publishing\IO\Publishers;

use App\Posts\Entities\Models\Post;
use App\SocialAccounts\Entities\Models\SocialAccount;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use RuntimeException;

final readonly class ThreadsPublisher implements PlatformPublisher
{
    private const BASE_URL = 'https://graph.threads.net';

    public function publish(Post $post, SocialAccount $account): string
    {
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
        $apiVersion = config('social-platforms.threads.api_version', 'v1.0');
        $userId = $account->platform_user_id;
        $accessToken = $account->access_token;

        $params = [
            'fields' => 'id,text,timestamp,permalink',
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

    public function delete(string $platformPostId, SocialAccount $account): void
    {
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
