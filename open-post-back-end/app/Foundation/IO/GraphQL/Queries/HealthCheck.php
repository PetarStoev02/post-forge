<?php

declare(strict_types=1);

namespace App\Foundation\IO\GraphQL\Queries;

/**
 * Health check query resolver.
 *
 * Returns a simple status string to verify the GraphQL API is operational.
 */
final readonly class HealthCheck
{
    public function __invoke(): string
    {
        return 'ok';
    }
}
