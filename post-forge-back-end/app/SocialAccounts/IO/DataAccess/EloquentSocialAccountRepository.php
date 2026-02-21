<?php

declare(strict_types=1);

namespace App\SocialAccounts\IO\DataAccess;

use App\SocialAccounts\Entities\Models\SocialAccount;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use Illuminate\Support\Collection;

final readonly class EloquentSocialAccountRepository implements SocialAccountRepository
{
    public function findById(string $id): ?SocialAccount
    {
        return SocialAccount::find($id);
    }

    public function findByWorkspace(string $workspaceId): Collection
    {
        return SocialAccount::query()
            ->where('workspace_id', $workspaceId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function createOrUpdate(
        string $workspaceId,
        string $platform,
        string $platformUserId,
        string $accessToken,
        ?string $refreshToken = null,
        ?\DateTimeInterface $tokenExpiresAt = null,
        ?array $metadata = null
    ): SocialAccount {
        return SocialAccount::updateOrCreate(
            [
                'workspace_id' => $workspaceId,
                'platform' => $platform,
                'platform_user_id' => $platformUserId,
            ],
            [
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'token_expires_at' => $tokenExpiresAt,
                'metadata' => $metadata ?? [],
            ]
        );
    }

    public function delete(string $id): bool
    {
        return SocialAccount::destroy($id) > 0;
    }
}
