<?php

declare(strict_types=1);

namespace App\Publishing\IO\Publishers;

use App\Foundation\Settings\OAuthCredentialsSettings;
use App\Posts\Entities\Models\Post;
use App\SocialAccounts\Entities\Models\SocialAccount;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use Illuminate\Support\Facades\Http;
use RuntimeException;

final readonly class TwitterPublisher implements PlatformPublisher
{
    private const BASE_URL = 'https://api.x.com/2';

    public function __construct(
        private OAuthCredentialsSettings $oauthCredentials,
        private SocialAccountRepository $socialAccountRepository,
    ) {}

    public function publish(Post $post, SocialAccount $account): string
    {
        $this->refreshTokenIfNeeded($account);

        $text = $this->buildText($post);

        $response = Http::withToken($account->access_token)
            ->asJson()
            ->post(self::BASE_URL . '/tweets', [
                'text' => $text,
            ]);

        if (! $response->successful()) {
            $error = $response->json('detail', $response->json('title', 'Unknown error creating tweet'));
            throw new RuntimeException("Twitter API error: {$error}");
        }

        $tweetId = $response->json('data.id');

        if (! $tweetId) {
            throw new RuntimeException('Twitter API did not return a tweet ID');
        }

        return (string) $tweetId;
    }

    private function refreshTokenIfNeeded(SocialAccount $account): void
    {
        if (! $account->needsReconnect()) {
            return;
        }

        if ($account->refresh_token === null) {
            throw new RuntimeException('Twitter access token expired and no refresh token available. Please reconnect your account.');
        }

        [$clientId, $clientSecret] = $this->resolveClientCredentials();

        $response = Http::asForm()
            ->withBasicAuth($clientId, $clientSecret)
            ->post(self::BASE_URL . '/oauth2/token', [
                'grant_type' => 'refresh_token',
                'refresh_token' => $account->refresh_token,
                'client_id' => $clientId,
            ]);

        if (! $response->successful()) {
            $error = $response->json('error_description', 'Unknown error refreshing token');
            throw new RuntimeException("Twitter token refresh failed: {$error}");
        }

        $expiresIn = $response->json('expires_in');

        $this->socialAccountRepository->updateTokens(
            $account->id,
            $response->json('access_token'),
            $response->json('refresh_token'),
            $expiresIn !== null ? now()->addSeconds($expiresIn) : null,
        );

        // Update the in-memory model so callers see fresh tokens
        $account->access_token = $response->json('access_token');

        $newRefreshToken = $response->json('refresh_token');
        if ($newRefreshToken !== null) {
            $account->refresh_token = $newRefreshToken;
        }

        if ($expiresIn !== null) {
            $account->token_expires_at = now()->addSeconds($expiresIn);
        }
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function resolveClientCredentials(): array
    {
        $dbCredentials = $this->oauthCredentials->get('x');

        $clientId = ($dbCredentials['client_id'] ?? '') !== ''
            ? $dbCredentials['client_id']
            : config('services.x.client_id');

        $clientSecret = ($dbCredentials['client_secret'] ?? '') !== ''
            ? $dbCredentials['client_secret']
            : config('services.x.client_secret');

        if (! $clientId || ! $clientSecret) {
            throw new RuntimeException('Twitter OAuth client credentials are not configured');
        }

        return [$clientId, $clientSecret];
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
