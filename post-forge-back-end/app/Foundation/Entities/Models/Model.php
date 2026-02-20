<?php

declare(strict_types=1);

namespace App\Foundation\Entities\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model as EloquentModel;

/**
 * Base Model class for all Eloquent models in PostForge.
 *
 * Uses ULIDs for primary keys instead of auto-incrementing integers
 * for better distributed system support and URL-friendliness.
 */
abstract class Model extends EloquentModel
{
    use HasUlids;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>
     */
    protected $guarded = [];

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The data type of the primary key.
     */
    protected $keyType = 'string';
}
