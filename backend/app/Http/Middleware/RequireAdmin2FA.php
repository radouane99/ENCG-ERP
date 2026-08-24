<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdmin2FA
{
    private const ADMIN_ROLES = ['super-admin', 'institution-admin', 'director'];

    /**
     * Vérifie que l'admin a configuré la 2FA.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->hasAnyRole(self::ADMIN_ROLES)) {
            if (! $user->two_factor_confirmed_at && ! $user->two_factor_secret) {
                return response()->json([
                    'success' => false,
                    'message' => '2FA requise pour les comptes administrateurs.',
                    'requires_2fa_setup' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}
