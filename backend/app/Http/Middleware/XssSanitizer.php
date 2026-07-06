<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class XssSanitizer
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $input = $request->all();
        
        // Strip tags from all string inputs
        array_walk_recursive($input, function (&$input) {
            if (is_string($input)) {
                $input = strip_tags($input);
            }
        });
        
        $request->merge($input);

        return $next($request);
    }
}
