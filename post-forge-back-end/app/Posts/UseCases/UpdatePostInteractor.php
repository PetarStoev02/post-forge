<?php

declare(strict_types=1);

namespace App\Posts\UseCases;

use App\Posts\Entities\Models\Post;
use App\Posts\UseCases\Contracts\PostRepository;
use App\Posts\UseCases\Requests\UpdatePostRequest;

final readonly class UpdatePostInteractor
{
    public function __construct(
        private PostRepository $postRepository,
    ) {}

    public function execute(string $id, UpdatePostRequest $request): Post
    {
        return $this->postRepository->update($id, $request->toArray());
    }
}
