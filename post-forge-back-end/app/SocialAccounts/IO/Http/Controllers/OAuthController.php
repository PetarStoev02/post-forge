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
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;

final class OAuthController
{
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

        return Socialite::driver($provider)->redirect();
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

        $socialiteUser = Socialite::driver($provider)->user();
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
            accessToken: $socialiteUser->getToken(),
            refreshToken: $socialiteUser->getRefreshToken(),
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
