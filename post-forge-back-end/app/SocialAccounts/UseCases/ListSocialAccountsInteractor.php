<?php

declare(strict_types=1);

namespace App\SocialAccounts\UseCases;

use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use Illuminate\Support\Collection;

final readonly class ListSocialAccountsInteractor
{
    public function __construct(
        private SocialAccountRepository $socialAccountRepository,
    ) {}

    /**
     * List social accounts for a specific workspace.
     *
     * @return Collection<int, \App\SocialAccounts\Entities\Models\SocialAccount>
     */
    public function execute(string $workspaceId): Collection
    {
        return $this->socialAccountRepository->findByWorkspace($workspaceId);
    }
}
