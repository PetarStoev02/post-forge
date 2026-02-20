<?php

declare(strict_types=1);

namespace App\Posts\UseCases;

use App\Posts\Entities\Models\Post;
use App\Posts\UseCases\Contracts\PostRepository;
use App\Posts\UseCases\Requests\CreatePostRequest;

final readonly class CreatePostInteractor
{
    public function __construct(
        private PostRepository $postRepository,
    ) {}

    public function execute(CreatePostRequest $request): Post
    {
        return $this->postRepository->create($request->toArray());
    }
}
