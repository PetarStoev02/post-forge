<?php

declare(strict_types=1);

namespace App\Providers;

use App\Publishing\IO\Publishers\ConcretePlatformPublisherRegistry;
use App\Publishing\IO\Publishers\ThreadsPublisher;
use App\Publishing\IO\Publishers\TwitterPublisher;
use App\Publishing\UseCases\Contracts\PlatformPublisherRegistry;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;

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
        \App\Posts\UseCases\Contracts\PostRepository::class => \App\Posts\IO\DataAccess\EloquentPostRepository::class,

        // Media Domain
        \App\Media\UseCases\Contracts\MediaStorageService::class => \App\Media\IO\Storage\LocalMediaStorageService::class,

        // SocialAccounts Domain
        \App\SocialAccounts\UseCases\Contracts\SocialAccountRepository::class => \App\SocialAccounts\IO\DataAccess\EloquentSocialAccountRepository::class,

        // Foundation Domain
        \App\Foundation\Settings\Contracts\SettingsRepository::class => \App\Foundation\IO\DataAccess\EloquentSettingsRepository::class,

        // Publishing Domain (registry binding is in register())
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PlatformPublisherRegistry::class, function ($app) {
            return new ConcretePlatformPublisherRegistry([
                'threads' => $app->make(ThreadsPublisher::class),
                'twitter' => $app->make(TwitterPublisher::class),
            ]);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(SocialiteWasCalled::class, [\SocialiteProviders\Threads\ThreadsExtendSocialite::class, 'handle']);
    }
}
