<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdmin2FA
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // [AUDIT SEC-05] Fixed: check all admin roles, not just non-existent 'admin' role
        $adminRoles = ['super-admin', 'institution-admin', 'director'];

        if ($user && $user->hasAnyRole($adminRoles)) {
            if (!$user->two_factor_confirmed_at) {
                return response()->json([
                    'message' => '2FA is required for administrator accounts. Please complete 2FA setup.',
                    'requires_2fa_setup' => true
                ], 403);
            }
        }

        return $next($request);
    }
}
