<?php

declare(strict_types=1);

namespace App\SocialAccounts\IO\Http\Controllers;

use App\Foundation\Settings\OAuthCredentialsSettings;
use App\SocialAccounts\Entities\Models\Workspace;
use App\SocialAccounts\Entities\SupportedOAuthProvider;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

final class OAuthController
{
    private const PROVIDER_SCOPES = [
        'threads' => ['threads_basic'],
        'x' => ['users.read', 'tweet.read', 'tweet.write', 'offline.access'],
        'linkedin-openid' => ['openid', 'profile', 'email', 'w_member_social'],
    ];

    public function __construct(
        private SocialAccountRepository $socialAccountRepository,
        private OAuthCredentialsSettings $oauthCredentials,
    ) {}

    /**
     * Redirect to the OAuth provider.
     */
    public function redirect(Request $request, string $provider): RedirectResponse
    {
        if (! SupportedOAuthProvider::isValid($provider)) {
            abort(404, 'Unknown OAuth provider.');
        }

        $this->applyOAuthCredentialsFromDatabase($provider);

        $driver = Socialite::driver($provider);

        $scopes = self::PROVIDER_SCOPES[$provider] ?? [];
        if ($scopes !== []) {
            $driver->scopes($scopes);
        }

        if ($provider === 'threads') {
            $driver->scopes(['threads_content_publish', 'threads_manage_replies', 'threads_delete', 'threads_manage_insights']);
        }

        return $driver->redirect();
    }

    /**
     * Handle the OAuth callback and store the social account.
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        if (! SupportedOAuthProvider::isValid($provider)) {
            abort(404, 'Unknown OAuth provider.');
        }

        $this->applyOAuthCredentialsFromDatabase($provider);

        $socialiteUser = Socialite::driver($provider)->stateless()->user();
        $workspace = Workspace::default();
        $platform = SupportedOAuthProvider::PLATFORM_MAP[$provider];

        $accessToken = $socialiteUser->token;
        $tokenExpiresAt = null;

        if ($socialiteUser->expiresIn !== null) {
            $tokenExpiresAt = Carbon::now()->addSeconds($socialiteUser->expiresIn);
        }

        // Threads: exchange short-lived token for a long-lived token (~60 days)
        if ($provider === 'threads') {
            [$accessToken, $tokenExpiresAt] = $this->exchangeThreadsLongLivedToken($accessToken);
        }

        $this->socialAccountRepository->createOrUpdate(
            workspaceId: $workspace->id,
            platform: $platform,
            platformUserId: (string) $socialiteUser->getId(),
            accessToken: $accessToken,
            refreshToken: $socialiteUser->refreshToken,
            tokenExpiresAt: $tokenExpiresAt,
            metadata: $this->buildMetadata($socialiteUser)
        );

        return redirect(config('app.frontend_url') . '/accounts?connected=1');
    }

    private function buildMetadata(SocialiteUser $user): array
    {
        return array_filter([
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'avatar' => $user->getAvatar(),
            'username' => $user->getNickname(),
        ]);
    }

    /**
     * Exchange a short-lived Threads token for a long-lived one (~60 days).
     *
     * @return array{0: string, 1: Carbon|null}
     */
    private function exchangeThreadsLongLivedToken(string $shortLivedToken): array
    {
        $clientSecret = config('services.threads.client_secret');
        $dbCredentials = $this->oauthCredentials->get('threads');
        if ($dbCredentials !== null && ($dbCredentials['client_secret'] ?? '') !== '') {
            $clientSecret = $dbCredentials['client_secret'];
        }

        $response = Http::get('https://graph.threads.net/access_token', [
            'grant_type' => 'th_exchange_token',
            'client_secret' => $clientSecret,
            'access_token' => $shortLivedToken,
        ]);

        if (! $response->successful()) {
            Log::warning('Threads long-lived token exchange failed', [
                'error' => $response->json('error.message', 'Unknown error'),
            ]);

            // Fall back to the short-lived token
            return [$shortLivedToken, null];
        }

        $longLivedToken = $response->json('access_token', $shortLivedToken);
        $expiresIn = $response->json('expires_in');
        $expiresAt = $expiresIn ? Carbon::now()->addSeconds($expiresIn) : null;

        return [$longLivedToken, $expiresAt];
    }

    private function applyOAuthCredentialsFromDatabase(string $provider): void
    {
        $credentials = $this->oauthCredentials->get($provider);
        if ($credentials === null) {
            return;
        }
        if ($credentials['client_id'] !== '') {
            Config::set('services.' . $provider . '.client_id', $credentials['client_id']);
        }
        if ($credentials['client_secret'] !== '') {
            Config::set('services.' . $provider . '.client_secret', $credentials['client_secret']);
        }
    }
}
