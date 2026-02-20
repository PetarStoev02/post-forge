<?php

declare(strict_types=1);

namespace App\Posts\UseCases\Contracts;

use App\Posts\Entities\Models\Post;
use Illuminate\Support\Collection;

interface PostRepository
{
    public function findById(string $id): ?Post;

    public function create(array $attributes): Post;

    public function update(string $id, array $attributes): Post;

    public function delete(string $id): bool;

    public function findByDateRange(string $startDate, string $endDate): Collection;

    public function findAll(): Collection;

    public function countByStatus(string $status): int;

    public function countByMonth(int $year, int $month): int;

    public function getUpcomingScheduled(int $limit): Collection;

    public function getScheduledDatesForMonth(int $year, int $month): array;

    public function getPostDatesForMonth(int $year, int $month): array;

    public function getPostsForDate(string $date): Collection;
}
