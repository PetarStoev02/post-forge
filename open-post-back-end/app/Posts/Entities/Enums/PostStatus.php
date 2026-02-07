<?php

declare(strict_types=1);

namespace App\Posts\Entities\Enums;

enum PostStatus: string
{
    case Draft = 'draft';
    case Scheduled = 'scheduled';
    case Pending = 'pending';
    case Published = 'published';
    case Cancelled = 'cancelled';
    case Failed = 'failed';

    public static function fromGraphQL(string $value): self
    {
        return match (strtoupper($value)) {
            'DRAFT' => self::Draft,
            'SCHEDULED' => self::Scheduled,
            'PENDING' => self::Pending,
            'PUBLISHED' => self::Published,
            'CANCELLED' => self::Cancelled,
            'FAILED' => self::Failed,
            default => throw new \InvalidArgumentException("Invalid status: {$value}"),
        };
    }

    public function toGraphQL(): string
    {
        return strtoupper($this->value);
    }
}
