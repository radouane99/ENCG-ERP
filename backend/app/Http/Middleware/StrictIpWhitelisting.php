<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class StrictIpWhitelisting
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $module = 'finance'): Response
    {
        // For local development, allow localhost
        if (app()->environment('local')) {
            return $next($request);
        }

        // In a real environment, this would come from a database or config
        $whitelistedIps = config("security.whitelisted_ips.{$module}", []);
        $clientIp = $request->ip();

        if (!in_array($clientIp, $whitelistedIps, true)) {
            Log::warning("Unauthorized access attempt from IP {$clientIp} to module {$module}");
            
            return response()->json([
                'message' => 'Unauthorized Access. Your IP Address is not whitelisted for this sensitive module.',
            ], 403);
        }

        return $next($request);
    }
}
