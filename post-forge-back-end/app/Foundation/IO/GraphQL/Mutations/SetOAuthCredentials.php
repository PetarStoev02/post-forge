<?php

declare(strict_types=1);

namespace App\Foundation\IO\GraphQL\Mutations;

use App\Foundation\Settings\OAuthCredentialsSettings;
use App\SocialAccounts\Entities\SupportedOAuthProvider;

final readonly class SetOAuthCredentials
{
    public function __construct(
        private OAuthCredentialsSettings $oauthCredentials,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{provider: string, clientId: string, clientSecret: string}  $args
     */
    public function __invoke(mixed $root, array $args): bool
    {
        $provider = $args['provider'];
        if (! SupportedOAuthProvider::isValid($provider)) {
            return false;
        }
        $this->oauthCredentials->set(
            $provider,
            $args['clientId'],
            $args['clientSecret']
        );

        return true;
    }
}
