<?php

declare(strict_types=1);

namespace App\Posts\IO\GraphQL\Queries;

use App\Posts\Entities\Models\Post;
use App\Posts\UseCases\Contracts\PostRepository;
use Illuminate\Support\Collection;

final readonly class ListPosts
{
    public function __construct(
        private PostRepository $postRepository,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array  $args
     */
    public function __invoke(mixed $root, array $args): Collection
    {
        $platform = $args['platform'] ?? null;
        $status = $args['status'] ?? null;

        if ($platform && $status) {
            return $this->postRepository->findByPlatform($platform)
                ->filter(fn (Post $post) => strtolower($post->status) === strtolower($status))
                ->values();
        }

        if ($status) {
            return $this->postRepository->findByStatus($status);
        }

        if ($platform) {
            return $this->postRepository->findByPlatform($platform);
        }

        return $this->postRepository->findAll();
    }
}
