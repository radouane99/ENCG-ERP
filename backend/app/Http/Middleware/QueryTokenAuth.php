<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class QueryTokenAuth
{
    /**
     * Allow a Bearer token in the query string only for browser streaming
     * (PDF / download / iframe). Never authenticate arbitrary API calls this way.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->headers->has('Authorization')) {
            $token = $request->query('token') ?? $request->query('bearer_token');
            if (is_string($token) && $token !== '' && $this->allowsQueryToken($request)) {
                $request->headers->set('Authorization', 'Bearer '.$token);
            }
        }

        return $next($request);
    }

    private function allowsQueryToken(Request $request): bool
    {
        $path = $request->path();

        return (bool) preg_match(
            '/(pdf|download|export|preview|serve-document|fiche-medicale|engagement|recepisse|ordre-de-service|pv-)/i',
            $path
        );
    }
}
