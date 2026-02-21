<?php

declare(strict_types=1);

namespace App\SocialAccounts\Entities\Models;

use App\Foundation\Entities\Models\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialAccount extends Model
{
    protected $table = 'social_accounts';

    protected $casts = [
        'access_token' => 'encrypted',
        'refresh_token' => 'encrypted',
        'token_expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Get platform in lowercase for storage; GraphQL will expose uppercase.
     */
    protected function platform(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => strtolower($value ?? ''),
            set: fn ($value) => strtolower($value),
        );
    }

    /**
     * Get the workspace that owns the social account.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Get the user that owns the social account (optional).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    /**
     * Check if the token is expired or will expire within the given minutes.
     */
    public function needsReconnect(int $withinMinutes = 5): bool
    {
        if ($this->token_expires_at === null) {
            return false;
        }

        return $this->token_expires_at->copy()->subMinutes($withinMinutes)->isPast();
    }

    /**
     * Platform in uppercase for GraphQL enum (Platform).
     */
    public function platformForGraphQL(): string
    {
        return strtoupper($this->platform);
    }
}
