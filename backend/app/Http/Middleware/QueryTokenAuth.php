<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class QueryTokenAuth
{
    /**
     * If no Authorization header is present but a token is provided in the query string
     * (e.g. for streaming PDFs / direct downloads in browser new tabs), populate the Authorization header.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->headers->has('Authorization')) {
            $token = $request->query('token') ?? $request->query('bearer_token');
            if ($token && is_string($token)) {
                $request->headers->set('Authorization', 'Bearer '.$token);
            }
        }

        return $next($request);
    }
}
