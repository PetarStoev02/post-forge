<?php

declare(strict_types=1);

namespace App\Posts\UseCases\Requests;

use App\Posts\Entities\Enums\Platform;
use App\Posts\Entities\Enums\PostStatus;
use Carbon\CarbonImmutable;
use Spatie\LaravelData\Data;

class CreatePostRequest extends Data
{
    public function __construct(
        public string $content,
        /** @var Platform[] */
        public array $platforms,
        public PostStatus $status = PostStatus::Draft,
        public ?CarbonImmutable $scheduledAt = null,
        /** @var string[] */
        public array $mediaUrls = [],
        /** @var string[] */
        public array $hashtags = [],
        /** @var string[] */
        public array $mentions = [],
        public ?array $linkPreview = null,
    ) {}

    public function toArray(): array
    {
        return [
            'content' => $this->content,
            'platforms' => array_map(fn(Platform $p) => $p->value, $this->platforms),
            'status' => $this->status,
            'scheduled_at' => $this->scheduledAt,
            'media_urls' => $this->mediaUrls,
            'hashtags' => $this->hashtags,
            'mentions' => $this->mentions,
            'link_preview' => $this->linkPreview,
        ];
    }
}
