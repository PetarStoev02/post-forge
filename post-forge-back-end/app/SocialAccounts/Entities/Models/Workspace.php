<?php

declare(strict_types=1);

namespace App\SocialAccounts\Entities\Models;

use App\Foundation\Entities\Models\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workspace extends Model
{
    protected $table = 'workspaces';

    /**
     * Get the default workspace (MVP: single-workspace mode).
     */
    public static function default(): self
    {
        return static::query()->where('slug', 'default')->firstOrFail();
    }

    /**
     * Get the social accounts for the workspace.
     */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }
}
