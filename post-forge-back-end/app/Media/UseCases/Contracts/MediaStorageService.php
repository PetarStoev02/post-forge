<?php

declare(strict_types=1);

namespace App\Media\UseCases\Contracts;

interface MediaStorageService
{
    /**
     * Delete a media file by its public URL.
     *
     * @return bool Whether the file was found and deleted
     */
    public function deleteByUrl(string $url): bool;
}
