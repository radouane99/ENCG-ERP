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
        // Implicitly grant "Super Admin" role all permissions
        // This works in the app by using gate-related functions like auth()->user->can() and @can()
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return $user->hasRole('super-admin') ? true : null;
        });

        // [AUDIT PERF-03] Enable lazy loading prevention in non-production to catch N+1 queries
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(!app()->isProduction());

        // [AUDIT PERF-04] Define the named API rate limiter used by throttle:api
        \Illuminate\Support\Facades\RateLimiter::for('api', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Register Observers for Anti-Fraud Module
        \App\Models\Grade::observe(\App\Observers\GradeObserver::class);
        
        // Register Listeners for Anti-Fraud Module
        \Illuminate\Support\Facades\Event::listen(
            \Illuminate\Auth\Events\Login::class,
            \App\Listeners\LogSuccessfulLogin::class
        );
    }
}
