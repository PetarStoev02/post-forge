<?php

declare(strict_types=1);

namespace App\Publishing\IO\GraphQL\Mutations;

use App\Publishing\IO\Publishers\ThreadsPublisher;
use App\SocialAccounts\Entities\Models\Workspace;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use GraphQL\Error\Error;

final readonly class DeleteThreadsPost
{
    public function __construct(
        private SocialAccountRepository $socialAccountRepository,
        private ThreadsPublisher $threadsPublisher,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{platformPostId: string}  $args
     */
    public function __invoke(mixed $root, array $args): bool
    {
        $account = $this->socialAccountRepository->findByWorkspaceAndPlatform(
            Workspace::default()->id,
            'threads'
        );

        if ($account === null) {
            throw new Error('No connected Threads account found.');
        }

        $this->threadsPublisher->delete($args['platformPostId'], $account);

        return true;
    }
}
