<?php

declare(strict_types=1);

namespace App\SocialAccounts\UseCases;

use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;

final readonly class DisconnectSocialAccountInteractor
{
    public function __construct(
        private SocialAccountRepository $socialAccountRepository,
    ) {}

    public function execute(string $id): bool
    {
        return $this->socialAccountRepository->delete($id);
    }
}
