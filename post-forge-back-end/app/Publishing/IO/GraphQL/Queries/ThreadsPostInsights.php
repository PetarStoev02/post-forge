<?php

declare(strict_types=1);

namespace App\Publishing\IO\GraphQL\Queries;

use App\Publishing\IO\Publishers\ThreadsPublisher;
use App\SocialAccounts\Entities\Models\Workspace;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;

final readonly class ThreadsPostInsights
{
    public function __construct(
        private SocialAccountRepository $socialAccountRepository,
        private ThreadsPublisher $threadsPublisher,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{platformPostId: string}  $args
     * @return array{views: int, likes: int, replies: int, reposts: int, quotes: int}|null
     */
    public function __invoke(mixed $root, array $args): ?array
    {
        $account = $this->socialAccountRepository->findByWorkspaceAndPlatform(
            Workspace::default()->id,
            'threads'
        );

        if ($account === null || $account->needsReconnect()) {
            return null;
        }

        try {
            return $this->threadsPublisher->fetchPostInsights($args['platformPostId'], $account);
        } catch (\Throwable) {
            return null;
        }
    }
}
