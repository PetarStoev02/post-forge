<?php

declare(strict_types=1);

namespace App\Foundation\IO\GraphQL\Queries;

use App\Foundation\Settings\OAuthCredentialsSettings;
use App\SocialAccounts\Entities\SupportedOAuthProvider;

final readonly class OAuthCredentials
{
    public function __construct(
        private OAuthCredentialsSettings $oauthCredentials,
    ) {}

    /**
     * @return list<array{provider: string, clientIdSet: bool, clientIdMasked: string|null, clientSecretSet: bool}>
     */
    public function __invoke(): array
    {
        $result = [];
        foreach (SupportedOAuthProvider::ALL as $provider) {
            $result[] = $this->oauthCredentials->getMasked($provider);
        }

        return $result;
    }
}
