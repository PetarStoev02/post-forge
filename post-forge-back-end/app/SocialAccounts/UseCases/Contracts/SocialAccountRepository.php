<?php

declare(strict_types=1);

namespace App\SocialAccounts\UseCases\Contracts;

use App\SocialAccounts\Entities\Models\SocialAccount;
use Illuminate\Support\Collection;

interface SocialAccountRepository
{
    public function findById(string $id): ?SocialAccount;

    /**
     * @return Collection<int, SocialAccount>
     */
    public function findByWorkspace(string $workspaceId): Collection;

    public function createOrUpdate(
        string $workspaceId,
        string $platform,
        string $platformUserId,
        string $accessToken,
        ?string $refreshToken = null,
        ?\DateTimeInterface $tokenExpiresAt = null,
        ?array $metadata = null
    ): SocialAccount;

    public function delete(string $id): bool;
}
