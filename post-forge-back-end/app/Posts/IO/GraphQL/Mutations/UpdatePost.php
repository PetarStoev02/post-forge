<?php

declare(strict_types=1);

namespace App\Posts\IO\GraphQL\Mutations;

use App\Posts\Entities\Enums\Platform;
use App\Posts\Entities\Enums\PostStatus;
use App\Posts\Entities\Models\Post;
use App\Posts\UseCases\UpdatePostInteractor;
use App\Posts\UseCases\Requests\UpdatePostRequest;
use Carbon\CarbonImmutable;

final readonly class UpdatePost
{
    public function __construct(
        private UpdatePostInteractor $interactor,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{id: string, input: array}  $args
     */
    public function __invoke(mixed $root, array $args): Post
    {
        $input = $args['input'];

        $request = new UpdatePostRequest(
            content: $input['content'] ?? null,
            platforms: isset($input['platforms'])
                ? array_map(fn(string $p) => Platform::fromGraphQL($p), $input['platforms'])
                : null,
            status: isset($input['status'])
                ? PostStatus::fromGraphQL($input['status'])
                : null,
            scheduledAt: isset($input['scheduledAt'])
                ? CarbonImmutable::parse($input['scheduledAt'])
                : null,
            mediaUrls: $input['mediaUrls'] ?? null,
            hashtags: $input['hashtags'] ?? null,
            mentions: $input['mentions'] ?? null,
            linkPreview: $input['linkPreview'] ?? null,
        );

        return $this->interactor->execute($args['id'], $request);
    }
}
