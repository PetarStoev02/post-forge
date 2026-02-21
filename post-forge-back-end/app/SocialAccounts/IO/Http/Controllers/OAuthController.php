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
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

final class OAuthController
{
    private const PROVIDER_SCOPES = [
        'facebook' => ['pages_show_list', 'pages_manage_posts'],
        'instagram' => ['instagram_business_basic'],
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

        if (isset(self::PROVIDER_SCOPES[$provider])) {
            $driver->setScopes(self::PROVIDER_SCOPES[$provider]);
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

        $tokenExpiresAt = null;
        if ($socialiteUser->expiresIn !== null) {
            $tokenExpiresAt = Carbon::now()->addSeconds($socialiteUser->expiresIn);
        }

        $this->socialAccountRepository->createOrUpdate(
            workspaceId: $workspace->id,
            platform: $platform,
            platformUserId: (string) $socialiteUser->getId(),
            accessToken: $socialiteUser->token,
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
