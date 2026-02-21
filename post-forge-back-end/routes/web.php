<?php

use App\SocialAccounts\Entities\SupportedOAuthProvider;
use App\SocialAccounts\IO\Http\Controllers\OAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/up');
});

/*
|--------------------------------------------------------------------------
| OAuth (Socialite) - Connect social accounts
|--------------------------------------------------------------------------
*/
Route::whereIn('provider', SupportedOAuthProvider::ALL)
    ->group(function () {
        Route::get('/auth/{provider}/redirect', [OAuthController::class, 'redirect'])
            ->name('auth.social.redirect');
        Route::get('/auth/{provider}/callback', [OAuthController::class, 'callback'])
            ->name('auth.social.callback');
    });
