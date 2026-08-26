<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Cookie;

class AuthCookie
{
    public const NAME = 'encg_auth_token';

    public static function encode(string $plainTextToken): string
    {
        return rtrim(strtr(base64_encode($plainTextToken), '+/', '-_'), '=');
    }

    public static function decode(?string $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        if (str_contains($value, '|')) {
            return $value;
        }

        $padded = strtr($value, '-_', '+/');
        $remainder = strlen($padded) % 4;
        if ($remainder > 0) {
            $padded .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode($padded, true);

        return is_string($decoded) && $decoded !== '' ? $decoded : $value;
    }

    public static function make(string $plainTextToken): Cookie
    {
        $secure = app()->environment('production');

        return cookie(
            self::NAME,
            self::encode($plainTextToken),
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
