<?php

declare(strict_types=1);

namespace App\Posts\Entities\ValueObjects;

use Spatie\LaravelData\Data;

class LinkPreview extends Data
{
    public function __construct(
        public string $url,
        public ?string $title = null,
        public ?string $description = null,
        public ?string $image = null,
    ) {}

    public static function fromArray(?array $data): ?self
    {
        if ($data === null || empty($data['url'])) {
            return null;
        }

        return new self(
            url: $data['url'],
            title: $data['title'] ?? null,
            description: $data['description'] ?? null,
            image: $data['image'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'url' => $this->url,
            'title' => $this->title,
            'description' => $this->description,
            'image' => $this->image,
        ];
    }
}
