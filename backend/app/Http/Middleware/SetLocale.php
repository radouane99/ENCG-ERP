<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED_LOCALES = ['fr', 'ar', 'en'];

    /**
     * Définit la langue selon l'en-tête Accept-Language.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->getPreferredLanguage(self::SUPPORTED_LOCALES);

        if ($locale) {
            App::setLocale($locale);
        }

        return $next($request);
    }
}
