<?php

declare(strict_types=1);

namespace App\Posts\IO\GraphQL\Mutations;

use App\Posts\Entities\Enums\Platform;
use App\Posts\Entities\Enums\PostStatus;
use App\Posts\Entities\Models\Post;
use App\Posts\UseCases\CreatePostInteractor;
use App\Posts\UseCases\Requests\CreatePostRequest;
use Carbon\CarbonImmutable;

final readonly class CreatePost
{
    public function __construct(
        private CreatePostInteractor $interactor,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{input: array}  $args
     */
    public function __invoke(mixed $root, array $args): Post
    {
        $input = $args['input'];

        $request = new CreatePostRequest(
            content: $input['content'],
            platforms: array_map(
                fn(string $p) => Platform::fromGraphQL($p),
                $input['platforms']
            ),
            status: isset($input['status'])
                ? PostStatus::fromGraphQL($input['status'])
                : PostStatus::Draft,
            scheduledAt: isset($input['scheduledAt'])
                ? CarbonImmutable::parse($input['scheduledAt'])
                : null,
            mediaUrls: $input['mediaUrls'] ?? [],
            hashtags: $input['hashtags'] ?? [],
            mentions: $input['mentions'] ?? [],
            linkPreview: $input['linkPreview'] ?? null,
        );

        return $this->interactor->execute($request);
    }
}
