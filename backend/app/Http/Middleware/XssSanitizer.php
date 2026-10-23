<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class XssSanitizer
{
    /**
     * Nettoie tous les inputs des balises HTML/JS (XSS).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        array_walk_recursive($input, function (&$value, $key) {
            // Authentication secrets are opaque bytes, never HTML input.
            if (is_string($value) && ! preg_match('/password|token|secret|code/i', (string) $key)) {
                $value = strip_tags($value);
            }
        });

        $request->merge($input);

        return $next($request);
    }
}
