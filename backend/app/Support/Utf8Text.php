<?php

declare(strict_types=1);

namespace App\Support;

final class Utf8Text
{
    /**
     * Repair UTF-8 that was decoded as CP437/OEM (Fès → F├¿s, École → ├ëcole).
     */
    public static function repair(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        if (! preg_match('/[├┬Γ]/u', $value)) {
            return $value;
        }

        $recovered = @iconv('UTF-8', 'CP437//IGNORE', $value);
        if (! is_string($recovered) || $recovered === '' || ! mb_check_encoding($recovered, 'UTF-8')) {
            return $value;
        }

        if (preg_match('/[├┬]/u', $recovered)) {
            return $value;
        }

        return $recovered;
    }
}
