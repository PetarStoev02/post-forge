<?php

declare(strict_types=1);

namespace App\Media\IO\Http\Controllers;

use App\Media\UseCases\DeleteMediaInteractor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final readonly class MediaDeleteController
{
    public function __construct(
        private DeleteMediaInteractor $deleteMedia,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'url' => ['required', 'string', 'url'],
        ]);

        $this->deleteMedia->execute($request->input('url'));

        return response()->json(null, 204);
    }
}
