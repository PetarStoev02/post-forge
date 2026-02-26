<?php

declare(strict_types=1);

namespace App\Media\UseCases;

use App\Media\UseCases\Contracts\MediaStorageService;
use App\Posts\UseCases\Contracts\PostRepository;

final readonly class DeleteMediaInteractor
{
    public function __construct(
        private MediaStorageService $storage,
        private PostRepository $postRepository,
    ) {}

    public function execute(string $url): void
    {
        $this->storage->deleteByUrl($url);
        $this->postRepository->removeMediaUrl($url);
    }
}
