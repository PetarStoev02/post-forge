<?php

declare(strict_types=1);

namespace App\Media\IO\Storage;

use App\Media\UseCases\Contracts\MediaStorageService;
use Illuminate\Support\Facades\Storage;

final readonly class LocalMediaStorageService implements MediaStorageService
{
    public function deleteByUrl(string $url): bool
    {
        $path = preg_replace('#^.*/storage/#', '', $url);

        if ($path && Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->delete($path);
        }

        return false;
    }
}
