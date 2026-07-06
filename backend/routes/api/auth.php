<?php

use Illuminate\Support\Facades\Route;
use App\Presentation\Api\Controllers\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\ContactController;

Route::post('/contact', [ContactController::class, 'send'])->middleware('throttle:6,1');

Route::prefix('v1/auth')->group(function () {
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail'])->middleware('throttle:5,1');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:5,1');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/two-factor/verify', [AuthController::class, 'verifyTwoFactor'])->middleware('throttle:5,1');
    
    // Google Socialite Auth
    Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        // 2FA management routes
        Route::post('/two-factor/setup', [AuthController::class, 'setup2FA']);
        Route::post('/two-factor/confirm', [AuthController::class, 'confirm2FA']);
        Route::delete('/two-factor/disable', [AuthController::class, 'disable2FA']);
    });
});
