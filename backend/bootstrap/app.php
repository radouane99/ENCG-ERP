<?php

use App\Http\Middleware\AuditTrailMiddleware;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\RequireAdmin2FA;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\XssSanitizer;
use App\Support\SentryReporter;
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
                    // Load testing-only routes only in the testing environment
                    if (app()->environment('testing')) {
                        require base_path('routes/testing.php');
                    }
                });
        }
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'require-admin-2fa' => RequireAdmin2FA::class,
            'password.changed' => EnsurePasswordChanged::class,
        ]);

        $middleware->api(prepend: [
            SetLocale::class,
        ]);

        $middleware->api(append: [
            XssSanitizer::class,
            AuditTrailMiddleware::class,
            EnsurePasswordChanged::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->reportable(function (Throwable $e) {
            app(SentryReporter::class)->capture($e);
        });
    })->create();
