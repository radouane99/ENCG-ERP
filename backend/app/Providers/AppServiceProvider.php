<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
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
        // [AUDIT PERF-03] Enable lazy loading prevention in non-production to catch N+1 queries
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(!app()->isProduction());

        // [AUDIT PERF-04] Define the named API rate limiter used by throttle:api
        \Illuminate\Support\Facades\RateLimiter::for('api', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
