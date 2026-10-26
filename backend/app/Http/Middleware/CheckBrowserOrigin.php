<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckBrowserOrigin
{
    public function handle(Request $request, Closure $next)
    {
        if (! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true) && $request->headers->has('Origin')) {
            $origin = rtrim(strtolower((string) $request->header('Origin')), '/');
            $currentHost = rtrim(strtolower((string) $request->getSchemeAndHttpHost()), '/');

            if ($origin === $currentHost) {
                return $next($request);
            }

            $allowed = array_filter(array_merge(
                [config('app.url'), config('app.frontend_url'), 'https://erp.irsale.fr', 'http://erp.irsale.fr'],
                config('cors.allowed_origins', [])
            ));
            $allowed = array_map(function ($url) {
                $parts = parse_url($url);

                return strtolower(($parts['scheme'] ?? '').'://'.($parts['host'] ?? '').(isset($parts['port']) ? ':'.$parts['port'] : ''));
            }, $allowed);
            abort_unless(in_array($origin, $allowed, true), 403, 'Origine de la requête non autorisée.');
        }

        return $next($request);
    }
}
