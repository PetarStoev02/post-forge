<?php

declare(strict_types=1);

namespace App\Posts\IO\GraphQL\Mutations;

use App\Posts\UseCases\DeletePostInteractor;

final readonly class DeletePost
{
    public function __construct(
        private DeletePostInteractor $interactor,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{id: string}  $args
     */
    public function __invoke(mixed $root, array $args): bool
    {
        return $this->interactor->execute($args['id']);
    }
}
