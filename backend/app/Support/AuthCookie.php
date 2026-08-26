<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Cookie;

class AuthCookie
{
    public const NAME = 'encg_auth_token';

    public static function make(string $plainTextToken): Cookie
    {
        $secure = app()->environment('production');

        return cookie(
            self::NAME,
            $plainTextToken,
            8 * 60,
            '/',
            env('AUTH_COOKIE_DOMAIN') ?: null,
            $secure,
            true,
            false,
            env('AUTH_COOKIE_SAMESITE', 'lax'),
        );
    }

    public static function forget(): Cookie
    {
        return cookie()->forget(self::NAME);
    }

    public static function attach(JsonResponse $response, string $plainTextToken): JsonResponse
    {
        return $response->withCookie(self::make($plainTextToken));
    }
}
