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
            abort_unless($user->institution_id, 403, 'Aucun établissement associé au compte.');
            abort_unless((int) $user->institution_id === (int) config('erp.institution_id', 1), 403, 'Établissement non autorisé sur cette instance.');
            $request->attributes->set('institution_id', $user->institution_id);
        }

        return $next($request);
    }
}
