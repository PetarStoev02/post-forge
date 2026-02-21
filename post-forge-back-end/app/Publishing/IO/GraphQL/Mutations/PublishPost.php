<?php

declare(strict_types=1);

namespace App\Publishing\IO\GraphQL\Mutations;

use App\Posts\Entities\Models\Post;
use App\Publishing\UseCases\PublishPostInteractor;

final readonly class PublishPost
{
    public function __construct(
        private PublishPostInteractor $interactor,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{id: string}  $args
     */
    public function __invoke(mixed $root, array $args): Post
    {
        return $this->interactor->execute($args['id']);
    }
}
