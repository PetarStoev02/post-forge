<?php

declare(strict_types=1);

namespace App\Posts\IO\GraphQL\Queries;

use App\Posts\UseCases\Contracts\PostRepository;
use App\Publishing\IO\Publishers\ThreadsPublisher;
use App\SocialAccounts\Entities\Models\Workspace;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use Carbon\Carbon;

final readonly class DashboardStats
{
    public function __construct(
        private PostRepository $postRepository,
        private SocialAccountRepository $socialAccountRepository,
        private ThreadsPublisher $threadsPublisher,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array  $args
     */
    public function __invoke(mixed $root, array $args): array
    {
        $now = Carbon::now();
        $currentYear = $now->year;
        $currentMonth = $now->month;
        $lastMonth = $now->copy()->subMonth();

        return [
            'totalPostsCount' => $this->postRepository->findAll()->count(),
            'totalPostsThisMonth' => $this->postRepository->countByMonth($currentYear, $currentMonth),
            'totalPostsLastMonth' => $this->postRepository->countByMonth($lastMonth->year, $lastMonth->month),
            'scheduledPostsCount' => $this->postRepository->countByStatus('scheduled'),
            'publishedPostsCount' => $this->postRepository->countByStatus('published'),
            'draftPostsCount' => $this->postRepository->countByStatus('draft'),
            'upcomingPosts' => $this->postRepository->getUpcomingScheduled(5),
            'scheduledDates' => $this->postRepository->getScheduledDatesForMonth($currentYear, $currentMonth),
            'postDates' => $this->postRepository->getPostDatesForMonth($currentYear, $currentMonth),
            'threadsEngagement' => $this->getThreadsEngagement(),
        ];
    }

    private function getThreadsEngagement(): ?array
    {
        $account = $this->socialAccountRepository->findByWorkspaceAndPlatform(
            Workspace::default()->id,
            'threads'
        );

        if ($account === null || $account->needsReconnect()) {
            return null;
        }

        try {
            $now = Carbon::now();
            $since = $now->copy()->subDays(30)->startOfDay()->getTimestamp();
            $until = $now->getTimestamp();

            $metrics = $this->threadsPublisher->fetchUserInsights(
                $account,
                (string) $since,
                (string) $until
            );

            $totalEngagements = $metrics['likes'] + $metrics['replies'] + $metrics['reposts'] + $metrics['quotes'];
            $engagementRate = $metrics['views'] > 0
                ? round(($totalEngagements / $metrics['views']) * 100, 2)
                : 0.0;

            return [
                'views' => $metrics['views'],
                'likes' => $metrics['likes'],
                'replies' => $metrics['replies'],
                'reposts' => $metrics['reposts'],
                'quotes' => $metrics['quotes'],
                'totalEngagements' => $totalEngagements,
                'engagementRate' => $engagementRate,
            ];
        } catch (\Throwable) {
            return null;
        }
    }
}
