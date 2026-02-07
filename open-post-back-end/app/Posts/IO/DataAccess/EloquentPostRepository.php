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
}
