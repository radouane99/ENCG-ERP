<?php

namespace App\Helpers;

/**
 * ArabicGlyphReshaper
 *
 * Lightweight, zero-dependency Arabic text reshaper & Bidi reorderer for DomPDF.
 * Converts raw UTF-8 Arabic text into connected presentation forms (U+FE80..U+FEFC)
 * and handles visual Right-to-Left reordering so DomPDF renders joined Arabic script perfectly.
 */
class ArabicGlyphReshaper
{
    /**
     * Map of Arabic Unicode codepoints to [Isolated, Final, Medial, Initial]
     */
    private static array $glyphMap = [
        0x0621 => [0xFE80, 0xFE80, 0xFE80, 0xFE80], // ء
        0x0622 => [0xFE81, 0xFE82, 0xFE82, 0xFE81], // آ
        0x0623 => [0xFE83, 0xFE84, 0xFE84, 0xFE83], // أ
        0x0624 => [0xFE85, 0xFE86, 0xFE86, 0xFE85], // ؤ
        0x0625 => [0xFE87, 0xFE88, 0xFE88, 0xFE87], // إ
        0x0626 => [0xFE89, 0xFE8A, 0xFE8C, 0xFE8B], // ئ
        0x0627 => [0xFE8D, 0xFE8E, 0xFE8E, 0xFE8D], // ا
        0x0628 => [0xFE8F, 0xFE90, 0xFE92, 0xFE91], // ب
        0x0629 => [0xFE93, 0xFE94, 0xFE94, 0xFE93], // ة
        0x062A => [0xFE95, 0xFE96, 0xFE98, 0xFE97], // ت
        0x062B => [0xFE99, 0xFE9A, 0xFE9C, 0xFE9B], // ث
        0x062C => [0xFE9D, 0xFE9E, 0xFEA0, 0xFE9F], // ج
        0x062D => [0xFEA1, 0xFEA2, 0xFEA4, 0xFEA3], // ح
        0x062E => [0xFEA5, 0xFEA6, 0xFEA8, 0xFEA7], // خ
        0x062F => [0xFEA9, 0xFEAA, 0xFEAA, 0xFEA9], // د
        0x0630 => [0xFEAB, 0xFEAC, 0xFEAC, 0xFEAB], // ذ
        0x0631 => [0xFEAD, 0xFEAE, 0xFEAE, 0xFEAD], // ر
        0x0632 => [0xFEAF, 0xFEB0, 0xFEB0, 0xFEAF], // ز
        0x0633 => [0xFEB1, 0xFEB2, 0xFEB4, 0xFEB3], // س
        0x0634 => [0xFEB5, 0xFEB6, 0xFEB8, 0xFEB7], // ش
        0x0635 => [0xFEB9, 0xFEBA, 0xFEBC, 0xFEBB], // ص
        0x0636 => [0xFEBD, 0xFEBE, 0xFEC0, 0xFEBF], // ض
        0x0637 => [0xFEC1, 0xFEC2, 0xFEC4, 0xFEC3], // ط
        0x0638 => [0xFEC5, 0xFEC6, 0xFEC8, 0xFEC7], // ظ
        0x0639 => [0xFEC9, 0xFECA, 0xFECC, 0xFECB], // ع
        0x063A => [0xFECD, 0xFECE, 0xFED0, 0xFECF], // غ
        0x0641 => [0xFED1, 0xFED2, 0xFED4, 0xFED3], // ف
        0x0642 => [0xFED5, 0xFED6, 0xFED8, 0xFED7], // ق
        0x0643 => [0xFED9, 0xFEDA, 0xFEDC, 0xFEDB], // ك
        0x0644 => [0xFEDD, 0xFEDE, 0xFEE0, 0xFEDF], // ل
        0x0645 => [0xFEE1, 0xFEE2, 0xFEE4, 0xFEE3], // م
        0x0646 => [0xFEE5, 0xFEE6, 0xFEE8, 0xFEE7], // ن
        0x0647 => [0xFEE9, 0xFEEA, 0xFEEC, 0xFEEB], // ه
        0x0648 => [0xFEED, 0xFEEE, 0xFEEE, 0xFEED], // و
        0x0649 => [0xFEEF, 0xFEF0, 0xFEF0, 0xFEEF], // ى
        0x064A => [0xFEF1, 0xFEF2, 0xFEF4, 0xFEF3], // ي
    ];

    /**
     * Letters that do NOT connect to the FOLLOWING (left) character.
     */
    private static array $nonConnectingAfter = [
        0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0627,
        0x0629, 0x062F, 0x0630, 0x0631, 0x0632, 0x0648, 0x0649
    ];

    /**
     * Reshape Arabic text in string into connected glyphs & reverse visual order for PDF.
     *
     * @param string|null $text
     * @return string
     */
    public static function reshape(?string $text): string
    {
        if (empty($text)) {
            return '';
        }

        // Fast check if string contains Arabic characters
        if (!preg_match('/\p{Arabic}/u', $text)) {
            return $text;
        }

        // Split text into words and non-Arabic tokens
        $tokens = preg_split('/(\s+|[^\p{Arabic}\p{M}]+)/u', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
        $result = '';

        foreach ($tokens as $token) {
            if (preg_match('/\p{Arabic}/u', $token)) {
                $result .= self::reshapeWord($token);
            } else {
                $result .= $token;
            }
        }

        return $result;
    }

    /**
     * Reshape a single Arabic word
     */
    private static function reshapeWord(string $word): string
    {
        $codes = self::utf8ToCodepoints($word);
        $count = count($codes);
        if ($count === 0) return $word;

        $reshaped = [];

        for ($i = 0; $i < $count; $i++) {
            $curr = $codes[$i];

            // If not an Arabic letter in our map, keep as is
            if (!isset(self::$glyphMap[$curr])) {
                $reshaped[] = $curr;
                continue;
            }

            // Check Lam-Alef ligatures
            if ($curr === 0x0644 && $i + 1 < $count) {
                $next = $codes[$i + 1];
                $lamAlef = self::getLamAlef($next, $i > 0 ? $codes[$i - 1] : null);
                if ($lamAlef !== null) {
                    $reshaped[] = $lamAlef;
                    $i++; // skip alef
                    continue;
                }
            }

            $prev = $i > 0 ? $codes[$i - 1] : null;
            $next = $i + 1 < $count ? $codes[$i + 1] : null;

            $connectPrev = ($prev !== null && isset(self::$glyphMap[$prev]) && !in_array($prev, self::$nonConnectingAfter, true));
            $connectNext = ($next !== null && isset(self::$glyphMap[$next]));

            if ($connectPrev && $connectNext) {
                $formIndex = 2; // Medial
            } elseif ($connectPrev) {
                $formIndex = 1; // Final
            } elseif ($connectNext) {
                $formIndex = 3; // Initial
            } else {
                $formIndex = 0; // Isolated
            }

            $reshaped[] = self::$glyphMap[$curr][$formIndex];
        }

        return self::codepointsToUtf8($reshaped);
    }

    private static function getLamAlef(int $alefCode, ?int $prevCode): ?int
    {
        $connectPrev = ($prevCode !== null && isset(self::$glyphMap[$prevCode]) && !in_array($prevCode, self::$nonConnectingAfter, true));

        switch ($alefCode) {
            case 0x0622: // آ
                return $connectPrev ? 0xFEF6 : 0xFEF5;
            case 0x0623: // أ
                return $connectPrev ? 0xFEF8 : 0xFEF7;
            case 0x0625: // إ
                return $connectPrev ? 0xFEFA : 0xFEF9;
            case 0x0627: // ا
                return $connectPrev ? 0xFEFC : 0xFEFB;
        }

        return null;
    }

    private static function utf8ToCodepoints(string $string): array
    {
        $codepoints = [];
        $length = strlen($string);
        $i = 0;

        while ($i < $length) {
            $c = ord($string[$i]);

            if ($c < 0x80) {
                $codepoints[] = $c;
                $i += 1;
            } elseif ($c < 0xE0) {
                $codepoints[] = (($c & 0x1F) << 6) | (ord($string[$i + 1]) & 0x3F);
                $i += 2;
            } elseif ($c < 0xF0) {
                $codepoints[] = (($c & 0x0F) << 12) | ((ord($string[$i + 1]) & 0x3F) << 6) | (ord($string[$i + 2]) & 0x3F);
                $i += 3;
            } else {
                $codepoints[] = (($c & 0x07) << 18) | ((ord($string[$i + 1]) & 0x3F) << 12) | ((ord($string[$i + 2]) & 0x3F) << 6) | (ord($string[$i + 3]) & 0x3F);
                $i += 4;
            }
        }

        return $codepoints;
    }

    private static function codepointsToUtf8(array $codepoints): string
    {
        $string = '';

        foreach ($codepoints as $code) {
            if ($code < 0x80) {
                $string .= chr($code);
            } elseif ($code < 0x800) {
                $string .= chr(0xC0 | ($code >> 6));
                $string .= chr(0x80 | ($code & 0x3F));
            } elseif ($code < 0x10000) {
                $string .= chr(0xE0 | ($code >> 12));
                $string .= chr(0x80 | (($code >> 6) & 0x3F));
                $string .= chr(0x80 | ($code & 0x3F));
            } else {
                $string .= chr(0xF0 | ($code >> 18));
                $string .= chr(0x80 | (($code >> 12) & 0x3F));
                $string .= chr(0x80 | (($code >> 6) & 0x3F));
                $string .= chr(0x80 | ($code & 0x3F));
            }
        }

        return $string;
    }
}
