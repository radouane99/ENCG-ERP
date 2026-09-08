<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstitutionContext
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            // Guarantee an institution context; default to 1 (ENCG Fès) if not set
            if (empty($user->institution_id)) {
                $user->institution_id = 1;
            }
            $request->attributes->set('institution_id', $user->institution_id);
        }

        return $next($request);
    }
}
