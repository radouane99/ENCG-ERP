<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        then: function () {
            // Modularized API Routes — [AUDIT PERF-04] throttle:api applied globally
            Route::middleware(['api', 'throttle:api'])
                ->prefix('api')
                ->group(function () {
                    require base_path('routes/api/auth.php');
                    require base_path('routes/api/student.php');
                    require base_path('routes/api/professor.php');
                    require base_path('routes/api/shared.php');
                    require base_path('routes/api/admin.php');
                });
        }
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'require-admin-2fa' => \App\Http\Middleware\RequireAdmin2FA::class,
        ]);
        
        // Ensure Sanctum is stateful if needed, though usually handled via config
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \App\Http\Middleware\SetLocale::class,
        ]);
        
        $middleware->api(append: [
            \App\Http\Middleware\XssSanitizer::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
