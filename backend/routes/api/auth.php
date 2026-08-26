<?php

use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\Auth\SsoController;
use App\Http\Controllers\Api\ContactController;
use App\Presentation\Api\Controllers\Auth\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/contact', [ContactController::class, 'send'])->middleware('throttle:6,1');

Route::get('/login', fn () => response()->json(['message' => 'Non authentifié. Veuillez vous connecter.'], 401))->name('login');

Route::prefix('v1/auth')->group(function () {
    Route::get('/check-cne-availability', [AuthController::class, 'checkCneAvailability'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail'])->middleware('throttle:login');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:login');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::post('/two-factor/verify', [AuthController::class, 'verifyTwoFactor'])->middleware('throttle:login');

    Route::get('/sso/providers', [SsoController::class, 'providers'])->middleware('throttle:30,1');
    Route::get('/sso/{provider}/redirect', [SsoController::class, 'redirect'])->middleware('throttle:30,1')->whereIn('provider', ['google', 'microsoft', 'oidc']);
    Route::get('/sso/{provider}/callback', [SsoController::class, 'callback'])->middleware('throttle:30,1')->whereIn('provider', ['google', 'microsoft', 'oidc']);
    Route::post('/sso/exchange', [SsoController::class, 'exchange'])->middleware('throttle:30,1');

    Route::get('/google/redirect', fn () => app(SsoController::class)->redirect('google'))->middleware('throttle:30,1');
    Route::get('/google/callback', fn (Request $request) => app(SsoController::class)->callback('google', $request))->middleware('throttle:30,1');
    Route::post('/google/exchange', [SsoController::class, 'exchange'])->middleware('throttle:30,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        // 2FA management routes
        Route::post('/two-factor/setup', [AuthController::class, 'setup2FA']);
        Route::post('/two-factor/confirm', [AuthController::class, 'confirm2FA']);
        Route::post('/two-factor/step-up', [AuthController::class, 'stepUpTwoFactor'])->middleware('throttle:login');
        Route::delete('/two-factor/disable', [AuthController::class, 'disable2FA']);
    });
});
