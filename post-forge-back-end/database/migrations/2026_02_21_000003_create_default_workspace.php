<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $id = (string) Str::ulid();
        DB::table('workspaces')->insert([
            'id' => $id,
            'name' => 'Default',
            'slug' => 'default',
            'owner_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('workspaces')->where('slug', 'default')->delete();
    }
};
