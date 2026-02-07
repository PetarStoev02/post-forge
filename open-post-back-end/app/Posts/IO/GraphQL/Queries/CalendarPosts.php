<?php

declare(strict_types=1);

namespace App\Posts\IO\GraphQL\Queries;

use App\Posts\UseCases\Contracts\PostRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

final readonly class CalendarPosts
{
    public function __construct(
        private PostRepository $postRepository,
    ) {}

    /**
     * @param  mixed  $root
     * @param  array{startDate: Carbon|string, endDate: Carbon|string}  $args
     */
    public function __invoke(mixed $root, array $args): Collection
    {
        $startDate = $args['startDate'] instanceof Carbon
            ? $args['startDate']->toDateString()
            : $args['startDate'];
        $endDate = $args['endDate'] instanceof Carbon
            ? $args['endDate']->toDateString()
            : $args['endDate'];

        return $this->postRepository->findByDateRange($startDate, $endDate);
    }
}
