<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Main Application Service Provider.
 *
 * Registers repository interfaces to their Eloquent implementations,
 * following the Dependency Inversion Principle of Clean Architecture.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Repository bindings: Interface => Implementation.
     *
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        // Identity Domain
        // \App\Identity\UseCases\Contracts\UserRepository::class => \App\Identity\IO\DataAccess\EloquentUserRepository::class,

        // Teams Domain
        // \App\Teams\UseCases\Contracts\TeamRepository::class => \App\Teams\IO\DataAccess\EloquentTeamRepository::class,

        // Posts Domain
        // \App\Posts\UseCases\Contracts\PostRepository::class => \App\Posts\IO\DataAccess\EloquentPostRepository::class,

        // Media Domain
        // \App\Media\UseCases\Contracts\MediaRepository::class => \App\Media\IO\DataAccess\EloquentMediaRepository::class,

        // SocialAccounts Domain
        // \App\SocialAccounts\UseCases\Contracts\SocialAccountRepository::class => \App\SocialAccounts\IO\DataAccess\EloquentSocialAccountRepository::class,

        // Publishing Domain
        // \App\Publishing\UseCases\Contracts\ScheduledPostRepository::class => \App\Publishing\IO\DataAccess\EloquentScheduledPostRepository::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
