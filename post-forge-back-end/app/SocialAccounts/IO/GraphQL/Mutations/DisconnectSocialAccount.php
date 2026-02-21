<?php

declare(strict_types=1);

namespace App\SocialAccounts\IO\GraphQL\Mutations;

use App\SocialAccounts\UseCases\DisconnectSocialAccountInteractor;

final readonly class DisconnectSocialAccount
{
    public function __construct(
        private DisconnectSocialAccountInteractor $interactor,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{id: string}  $args
     */
    public function __invoke(mixed $root, array $args): bool
    {
        return $this->interactor->execute($args['id']);
    }
}
