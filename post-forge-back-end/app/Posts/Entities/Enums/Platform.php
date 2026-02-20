<?php

declare(strict_types=1);

namespace App\Posts\Entities\Enums;

enum Platform: string
{
    case Twitter = 'twitter';
    case Instagram = 'instagram';
    case LinkedIn = 'linkedin';

    public static function fromGraphQL(string $value): self
    {
        return match (strtoupper($value)) {
            'TWITTER' => self::Twitter,
            'INSTAGRAM' => self::Instagram,
            'LINKEDIN' => self::LinkedIn,
            default => throw new \InvalidArgumentException("Invalid platform: {$value}"),
        };
    }

    public function toGraphQL(): string
    {
        return strtoupper($this->value);
    }
}
