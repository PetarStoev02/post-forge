<?php

declare(strict_types=1);

namespace App\SocialAccounts\IO\GraphQL\Queries;

use App\SocialAccounts\Entities\Models\Workspace;
use App\SocialAccounts\UseCases\ListSocialAccountsInteractor;
use Illuminate\Support\Collection;

final readonly class ListSocialAccounts
{
    public function __construct(
        private ListSocialAccountsInteractor $listInteractor,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array  $args
     * @return Collection<int, \App\SocialAccounts\Entities\Models\SocialAccount>
     */
    public function __invoke(mixed $root, array $args): Collection
    {
        return $this->listInteractor->execute(Workspace::default()->id);
    }
}
