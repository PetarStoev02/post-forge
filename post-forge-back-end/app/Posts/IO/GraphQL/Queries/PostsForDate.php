<?php

declare(strict_types=1);

namespace App\Posts\IO\GraphQL\Queries;

use App\Posts\UseCases\Contracts\PostRepository;
use Illuminate\Support\Collection;

final readonly class PostsForDate
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
        return $this->postRepository->getPostsForDate($args['date']);
    }
}
