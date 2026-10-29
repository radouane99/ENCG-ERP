<?php

namespace App\Http\Middleware;

use App\Services\Monitoring\RuntimeMetrics;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

final class RecordHttpMetrics
{
    public function handle(Request $request, Closure $next)
    {
        if (! config('observability.enabled') || $request->is('api/internal/metrics', 'up', 'api/health/ready')) {
            return $next($request);
        }
        $start = microtime(true);
        $status = 500;
        try {
            $response = $next($request);
            $status = $response->getStatusCode();

            return $response;
        } catch (\Throwable $e) {
            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;
            throw $e;
        } finally {
            try {
                app(RuntimeMetrics::class)->record($request->method(), $status, microtime(true) - $start);
            } catch (\Throwable) {
                // Monitoring must never cause application requests to fail.
            }
        }
    }
}
