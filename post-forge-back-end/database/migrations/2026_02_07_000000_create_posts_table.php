<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->text('content');
            $table->json('platforms'); // Array of platforms: ['twitter', 'instagram', 'linkedin']
            $table->string('status')->default('draft'); // draft, scheduled, published, failed
            $table->timestamp('scheduled_at')->nullable();
            $table->json('media_urls')->nullable(); // Array of media attachment URLs
            $table->json('hashtags')->nullable(); // Array of hashtags
            $table->json('mentions')->nullable(); // Array of mentions
            $table->json('link_preview')->nullable(); // {url, title, description, image}
            $table->timestamps();

            $table->index('status');
            $table->index('scheduled_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
