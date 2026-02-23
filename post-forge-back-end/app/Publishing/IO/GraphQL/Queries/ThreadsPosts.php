<?php

declare(strict_types=1);

namespace App\Publishing\IO\GraphQL\Queries;

use App\Publishing\IO\Publishers\ThreadsPublisher;
use App\SocialAccounts\Entities\Models\Workspace;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use Illuminate\Support\Facades\Log;

final readonly class ThreadsPosts
{
    public function __construct(
        private SocialAccountRepository $socialAccountRepository,
        private ThreadsPublisher $threadsPublisher,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{limit?: int, after?: string}  $args
     * @return array{posts: array<int, array<string, mixed>>, nextCursor: string|null, hasNextPage: bool}
     */
    public function __invoke(mixed $root, array $args): array
    {
        $empty = ['posts' => [], 'nextCursor' => null, 'hasNextPage' => false];

        $account = $this->socialAccountRepository->findByWorkspaceAndPlatform(
            Workspace::default()->id,
            'threads'
        );

        if ($account === null || $account->needsReconnect()) {
            return $empty;
        }

        try {
            $limit = $args['limit'] ?? 25;
            $after = $args['after'] ?? null;

            $response = $this->threadsPublisher->fetchThreads($account, $after, $limit);

            $posts = array_map(fn (array $item) => [
                'platformPostId' => (string) $item['id'],
                'text' => $item['text'] ?? null,
                'timestamp' => $item['timestamp'],
                'permalink' => $item['permalink'],
                'mediaType' => $item['media_type'] ?? null,
                'mediaUrl' => $item['media_url'] ?? null,
                'thumbnailUrl' => $item['thumbnail_url'] ?? null,
            ], $response['data'] ?? []);

            $nextCursor = $response['paging']['cursors']['after'] ?? null;
            $hasNextPage = isset($response['paging']['next']);

            return [
                'posts' => $posts,
                'nextCursor' => $nextCursor,
                'hasNextPage' => $hasNextPage,
            ];
        } catch (\Throwable $e) {
            Log::warning('Failed to fetch Threads posts', [
                'error' => $e->getMessage(),
                'account_id' => $account->id,
            ]);

            return $empty;
        }
    }
}
