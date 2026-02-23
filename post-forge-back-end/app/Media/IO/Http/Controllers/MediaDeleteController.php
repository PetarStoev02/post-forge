<?php

declare(strict_types=1);

namespace App\Media\IO\Http\Controllers;

use App\Posts\Entities\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

final class MediaDeleteController
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'url' => ['required', 'string', 'url'],
        ]);

        $url = $request->input('url');

        // Extract the storage path from the URL (strip everything up to and including /storage/)
        $path = preg_replace('#^.*/storage/#', '', $url);

        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        // Remove the URL from any posts that reference it
        Post::whereJsonContains('media_urls', $url)->each(function (Post $post) use ($url) {
            $urls = array_values(array_filter(
                $post->media_urls ?? [],
                fn (string $u) => $u !== $url,
            ));
            $post->update(['media_urls' => $urls]);
        });

        return response()->json(null, 204);
    }
}
