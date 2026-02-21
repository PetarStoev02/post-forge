<?php

declare(strict_types=1);

namespace App\Posts\IO\GraphQL\Queries;

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
        if (isset($args['platform'])) {
            return $this->postRepository->findByPlatform($args['platform']);
        }

        return $this->postRepository->findAll();
    }
}
