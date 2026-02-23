<?php

declare(strict_types=1);

namespace App\Posts\IO\DataAccess;

use App\Posts\Entities\Models\Post;
use App\Posts\UseCases\Contracts\PostRepository;
use Illuminate\Support\Collection;

final readonly class EloquentPostRepository implements PostRepository
{
    public function findById(string $id): ?Post
    {
        return Post::find($id);
    }

    public function create(array $attributes): Post
    {
        $post = Post::create($attributes);

        return $post->fresh();
    }

    public function update(string $id, array $attributes): Post
    {
        $post = Post::findOrFail($id);
        $post->update($attributes);

        return $post->fresh();
    }

    public function delete(string $id): bool
    {
        return Post::destroy($id) > 0;
    }

    public function findByDateRange(string $startDate, string $endDate): Collection
    {
        return Post::query()
            ->scheduledBetween($startDate, $endDate)
            ->orderBy('scheduled_at')
            ->get();
    }

    public function findAll(): Collection
    {
        return Post::query()
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findByPlatform(string $platform): Collection
    {
        return Post::query()
            ->forPlatform($platform)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findByStatus(string $status): Collection
    {
        return Post::query()
            ->withStatus($status)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function countByStatus(string $status): int
    {
        return Post::query()
            ->withStatus($status)
            ->count();
    }

    public function countByMonth(int $year, int $month): int
    {
        return Post::query()
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->count();
    }

    public function getUpcomingScheduled(int $limit): Collection
    {
        return Post::query()
            ->withStatus('scheduled')
            ->where('scheduled_at', '>', now())
            ->orderBy('scheduled_at', 'asc')
            ->limit($limit)
            ->get();
    }

    public function getScheduledDatesForMonth(int $year, int $month): array
    {
        return Post::query()
            ->withStatus('scheduled')
            ->whereYear('scheduled_at', $year)
            ->whereMonth('scheduled_at', $month)
            ->selectRaw('DATE(scheduled_at) as date')
            ->distinct()
            ->pluck('date')
            ->map(fn ($date) => $date instanceof \Carbon\Carbon ? $date->format('Y-m-d') : $date)
            ->toArray();
    }

    public function getPostDatesForMonth(int $year, int $month): array
    {
        return Post::query()
            ->whereNotNull('scheduled_at')
            ->whereYear('scheduled_at', $year)
            ->whereMonth('scheduled_at', $month)
            ->selectRaw('DATE(scheduled_at) as date')
            ->distinct()
            ->pluck('date')
            ->map(fn ($date) => $date instanceof \Carbon\Carbon ? $date->format('Y-m-d') : $date)
            ->toArray();
    }

    public function getPostsForDate(string $date): Collection
    {
        return Post::query()
            ->whereDate('scheduled_at', $date)
            ->orderBy('scheduled_at', 'asc')
            ->get();
    }
}
