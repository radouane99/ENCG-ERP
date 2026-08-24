<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ($user->must_change_password ?? false)) {
            $allowed = $request->is(
                'api/v1/auth/change-password',
                'api/v1/auth/logout',
                'api/v1/auth/me',
            );

            if (! $allowed) {
                return response()->json([
                    'message' => 'Vous devez changer votre mot de passe avant de continuer.',
                    'must_change_password' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}
