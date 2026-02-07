<?php

declare(strict_types=1);

namespace App\Posts\Entities\Models;

use App\Foundation\Entities\Models\Model;
use App\Posts\Entities\Enums\PostStatus;
use App\Posts\Entities\ValueObjects\LinkPreview;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Post extends Model
{
    protected $table = 'posts';

    protected $casts = [
        'platforms' => 'array',
        'scheduled_at' => 'datetime',
        'media_urls' => 'array',
        'hashtags' => 'array',
        'mentions' => 'array',
        'link_preview' => 'array',
    ];

    protected $attributes = [
        'media_urls' => '[]',
        'hashtags' => '[]',
        'mentions' => '[]',
    ];

    /**
     * Get platforms in uppercase for GraphQL serialization.
     */
    protected function platforms(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => array_map('strtoupper', json_decode($value, true) ?? []),
            set: fn ($value) => json_encode(array_map('strtolower', $value)),
        );
    }

    /**
     * Get status in uppercase for GraphQL serialization.
     */
    protected function status(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => strtoupper($value),
            set: function ($value) {
                if ($value instanceof PostStatus) {
                    return $value->value;
                }

                return strtolower($value);
            },
        );
    }

    /**
     * Get the link preview as a value object.
     */
    public function getLinkPreviewObjectAttribute(): ?LinkPreview
    {
        return LinkPreview::fromArray($this->link_preview);
    }

    /**
     * Scope to filter posts by status.
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', strtolower($status));
    }

    /**
     * Scope to filter posts scheduled between dates.
     */
    public function scopeScheduledBetween($query, string $startDate, string $endDate)
    {
        return $query->whereBetween('scheduled_at', [$startDate, $endDate]);
    }

    /**
     * Scope to get posts that need to be published.
     */
    public function scopeReadyToPublish($query)
    {
        return $query
            ->where('status', 'scheduled')
            ->where('scheduled_at', '<=', now());
    }
}
