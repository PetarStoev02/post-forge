<?php

declare(strict_types=1);

namespace App\Posts\UseCases;

use App\Posts\UseCases\Contracts\PostRepository;
use App\Publishing\IO\Publishers\ThreadsPublisher;
use App\SocialAccounts\Entities\Models\Workspace;
use App\SocialAccounts\UseCases\Contracts\SocialAccountRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

final readonly class DeletePostInteractor
{
    public function __construct(
        private PostRepository $postRepository,
        private SocialAccountRepository $socialAccountRepository,
        private ThreadsPublisher $threadsPublisher,
    ) {}

    public function execute(string $id): bool
    {
        $post = $this->postRepository->findById($id);

        if ($post === null) {
            return false;
        }

        $platformPostIds = $post->platform_post_ids ?? [];

        if ($platformPostIds !== []) {
            $workspace = Workspace::default();

            foreach ($platformPostIds as $platform => $platformPostId) {
                try {
                    $account = $this->socialAccountRepository->findByWorkspaceAndPlatform(
                        $workspace->id,
                        $platform
                    );

                    if ($account === null) {
                        Log::warning("No connected {$platform} account found, skipping platform deletion", [
                            'post_id' => $id,
                            'platform' => $platform,
                        ]);

                        continue;
                    }

                    match ($platform) {
                        'threads' => $this->threadsPublisher->delete($platformPostId, $account),
                        default => Log::warning("Deleting from {$platform} is not yet supported", [
                            'post_id' => $id,
                            'platform' => $platform,
                        ]),
                    };
                } catch (\Throwable $e) {
                    Log::warning("Failed to delete post from {$platform}, proceeding with local deletion", [
                        'post_id' => $id,
                        'platform' => $platform,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        // Clean up associated media files from disk
        $mediaUrls = $post->media_urls ?? [];
        foreach ($mediaUrls as $url) {
            try {
                $path = preg_replace('#^.*/storage/#', '', $url);
                if ($path) {
                    Storage::disk('public')->delete($path);
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to delete media file during post deletion', [
                    'post_id' => $id,
                    'url' => $url,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $this->postRepository->delete($id);
    }
}
