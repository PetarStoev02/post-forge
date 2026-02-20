<?php

declare(strict_types=1);

namespace App\Posts\UseCases;

use App\Posts\UseCases\Contracts\PostRepository;

final readonly class DeletePostInteractor
{
    public function __construct(
        private PostRepository $postRepository,
    ) {}

    public function execute(string $id): bool
    {
        return $this->postRepository->delete($id);
    }
}
