<?php

declare(strict_types=1);

namespace App\Support;

final class SignedDocumentUrl
{
    public static function make(string $type, string $cne, int $ttlSeconds = 900): string
    {
        $type = strtolower(trim($type));
        $cne = strtoupper(trim($cne));
        $exp = (string) (time() + $ttlSeconds);
        $sig = self::signature($type, $cne, $exp);

        return '/api/public/serve-document/'.rawurlencode($type).'/'.rawurlencode($cne).'?exp='.$exp.'&sig='.$sig;
    }

    public static function isValid(string $type, string $cne, mixed $exp, mixed $sig): bool
    {
        $exp = is_numeric($exp) ? (string) (int) $exp : '';
        $sig = is_string($sig) ? $sig : '';

        if ($exp === '' || $sig === '' || (int) $exp < time()) {
            return false;
        }

        $expected = self::signature(strtolower(trim($type)), strtoupper(trim($cne)), $exp);

        return hash_equals($expected, $sig);
    }

    private static function signature(string $type, string $cne, string $exp): string
    {
        return hash_hmac('sha256', $type.'|'.$cne.'|'.$exp, (string) config('app.key'));
    }
}
