<?php

declare(strict_types=1);

namespace App\Posts\UseCases\Requests;

use App\Posts\Entities\Enums\Platform;
use App\Posts\Entities\Enums\PostStatus;
use Carbon\CarbonImmutable;
use Spatie\LaravelData\Data;

class UpdatePostRequest extends Data
{
    public function __construct(
        public ?string $content = null,
        /** @var Platform[]|null */
        public ?array $platforms = null,
        public ?PostStatus $status = null,
        public ?CarbonImmutable $scheduledAt = null,
        /** @var string[]|null */
        public ?array $mediaUrls = null,
        /** @var string[]|null */
        public ?array $hashtags = null,
        /** @var string[]|null */
        public ?array $mentions = null,
        public ?array $linkPreview = null,
    ) {}

    public function toArray(): array
    {
        $data = [];

        if ($this->content !== null) {
            $data['content'] = $this->content;
        }

        if ($this->platforms !== null) {
            $data['platforms'] = array_map(fn(Platform $p) => $p->value, $this->platforms);
        }

        if ($this->status !== null) {
            $data['status'] = $this->status;
        }

        if ($this->scheduledAt !== null) {
            $data['scheduled_at'] = $this->scheduledAt;
        }

        if ($this->mediaUrls !== null) {
            $data['media_urls'] = $this->mediaUrls;
        }

        if ($this->hashtags !== null) {
            $data['hashtags'] = $this->hashtags;
        }

        if ($this->mentions !== null) {
            $data['mentions'] = $this->mentions;
        }

        if ($this->linkPreview !== null) {
            $data['link_preview'] = $this->linkPreview;
        }

        return $data;
    }
}
