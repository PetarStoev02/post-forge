<?php

declare(strict_types=1);

namespace App\Publishing\IO\GraphQL\Queries;

use App\Publishing\IO\Publishers\ThreadsPublisher;
use App\SocialAccounts\Entities\Models\Workspace;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use Illuminate\Support\Carbon;

final readonly class ThreadsCalendarPosts
{
    public function __construct(
        private SocialAccountRepository $socialAccountRepository,
        private ThreadsPublisher $threadsPublisher,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{startDate: string, endDate: string}  $args
     * @return array<int, array{platformPostId: string, text: string|null, timestamp: string, permalink: string}>
     */
    public function __invoke(mixed $root, array $args): array
    {
        $account = $this->socialAccountRepository->findByWorkspaceAndPlatform(
            Workspace::default()->id,
            'threads'
        );

        if ($account === null || $account->needsReconnect()) {
            return [];
        }

        $startDate = Carbon::parse($args['startDate'])->startOfDay();
        $endDate = Carbon::parse($args['endDate'])->endOfDay();

        try {
            $allPosts = [];
            $after = null;
            $maxPages = 5;

            for ($page = 0; $page < $maxPages; $page++) {
                $response = $this->threadsPublisher->fetchThreads($account, $after, 50);
                $data = $response['data'] ?? [];

                if ($data === []) {
                    break;
                }

                foreach ($data as $item) {
                    $timestamp = Carbon::parse($item['timestamp']);

                    // Stop pagination if we've gone past the start date
                    if ($timestamp->lt($startDate)) {
                        return $allPosts;
                    }

                    if ($timestamp->lte($endDate)) {
                        $allPosts[] = [
                            'platformPostId' => (string) $item['id'],
                            'text' => $item['text'] ?? null,
                            'timestamp' => $item['timestamp'],
                            'permalink' => $item['permalink'],
                        ];
                    }
                }

                $after = $response['paging']['cursors']['after'] ?? null;
                $hasNextPage = isset($response['paging']['next']);

                if (! $hasNextPage || $after === null) {
                    break;
                }
            }

            return $allPosts;
        } catch (\Throwable) {
            return [];
        }
    }
}
