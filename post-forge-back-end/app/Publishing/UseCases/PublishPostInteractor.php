<?php

declare(strict_types=1);

namespace App\Publishing\UseCases;

use App\Posts\Entities\Enums\PostStatus;
use App\Posts\Entities\Models\Post;
use App\Posts\UseCases\Contracts\PostRepository;
use App\Publishing\IO\Publishers\ThreadsPublisher;
use App\Publishing\IO\Publishers\TwitterPublisher;
use App\SocialAccounts\Entities\Models\Workspace;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use RuntimeException;

final readonly class PublishPostInteractor
{
    public function __construct(
        private PostRepository $postRepository,
        private SocialAccountRepository $socialAccountRepository,
        private ThreadsPublisher $threadsPublisher,
        private TwitterPublisher $twitterPublisher,
    ) {}

    public function execute(string $postId): Post
    {
        $post = $this->postRepository->findById($postId);

        if ($post === null) {
            throw new RuntimeException("Post not found: {$postId}");
        }

        $workspace = Workspace::default();

        try {
            $platforms = array_map('strtolower', $post->platforms);
            $platformPostIds = [];

            foreach ($platforms as $platform) {
                $account = $this->socialAccountRepository->findByWorkspaceAndPlatform(
                    $workspace->id,
                    $platform
                );

                if ($account === null) {
                    throw new RuntimeException("No connected {$platform} account found");
                }

                $platformPostId = match ($platform) {
                    'threads' => $this->threadsPublisher->publish($post, $account),
                    'twitter' => $this->twitterPublisher->publish($post, $account),
                    default => throw new RuntimeException("Publishing to {$platform} is not yet supported"),
                };

                $platformPostIds[$platform] = $platformPostId;
            }

            $this->postRepository->update($postId, [
                'status' => PostStatus::Published,
                'platform_post_ids' => $platformPostIds,
                'error_message' => null,
            ]);

            return $this->postRepository->findById($postId);
        } catch (\Throwable $e) {
            $this->postRepository->update($postId, [
                'status' => PostStatus::Failed,
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
