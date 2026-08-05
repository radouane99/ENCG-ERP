<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class StrictIpWhitelisting
{
    /**
     * Restreint l'accès aux IPs whitelistées par module.
     */
    public function handle(Request $request, Closure $next, string $module = 'finance'): Response
    {
        if (app()->environment('local')) {
            return $next($request);
        }

        $whitelistedIps = config("security.whitelisted_ips.{$module}", []);
        $clientIp       = $request->ip();

        if (!in_array($clientIp, $whitelistedIps, true)) {
            Log::warning("Accès non autorisé — IP {$clientIp} — Module {$module}");

            return response()->json([
                'success' => false,
                'message' => 'Accès refusé. Votre adresse IP n\'est pas autorisée pour ce module.',
            ], 403);
        }

        return $next($request);
    }
}