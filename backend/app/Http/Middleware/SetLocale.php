<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('Accept-Language', 'fr');

        // Extract just the language code if it contains region or quality values (e.g. "fr-FR,fr;q=0.9")
        $langCode = substr($locale, 0, 2);

        if (in_array($langCode, ['fr', 'ar', 'en'])) {
            App::setLocale($langCode);
        }

        return $next($request);
    }
}
