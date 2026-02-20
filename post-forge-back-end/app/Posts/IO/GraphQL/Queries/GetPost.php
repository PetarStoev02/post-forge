<?php

declare(strict_types=1);

namespace App\Posts\IO\GraphQL\Queries;

use App\Posts\Entities\Models\Post;
use App\Posts\UseCases\Contracts\PostRepository;

final readonly class GetPost
{
    public function __construct(
        private PostRepository $postRepository,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{id: string}  $args
     */
    public function __invoke(mixed $root, array $args): ?Post
    {
        return $this->postRepository->findById($args['id']);
    }
}
