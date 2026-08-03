<?php

namespace App\OCR\Engines;

use App\OCR\Contracts\OcrEngineInterface;

/**
 * Tier 3 OCR Engine — PDF Binary Stream Fallback
 *
 * Last resort when both pdftotext and Tesseract fail.
 * Reads raw PDF byte streams and extracts text strings from Tj/TJ operators.
 * Handles both uncompressed and zlib-compressed streams.
 */
class PdfBinaryEngine implements OcrEngineInterface
{
    public function supports(string $mimeType, string $filePath, string $docType = ''): bool
    {
        return $this->isPdf($mimeType, $filePath);
    }

    public function extract(string $filePath, string $mimeType): string
    {
        $raw  = @file_get_contents($filePath) ?: '';
        $text = '';

        // Uncompressed Tj/TJ operators: (text) Tj
        if (preg_match_all('/\((.*?)\)\s*T[jJ]/s', $raw, $m)) {
            $text .= implode(' ', $m[1]) . "\n";
        }

        // Compressed streams: inflate then extract Tj/TJ
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $raw, $streams)) {
            foreach ($streams[1] as $st) {
                $dec = @gzuncompress($st) ?: @gzinflate($st);
                if ($dec && preg_match_all('/\((.*?)\)\s*T[jJ]/s', $dec, $m2)) {
                    $text .= implode(' ', $m2[1]) . "\n";
                }
            }
        }

        return $text;
    }

    private function isPdf(string $mimeType, string $filePath): bool
    {
        if (str_contains(strtolower($mimeType), 'pdf')) return true;
        $raw = @file_get_contents($filePath, false, null, 0, 4);
        return str_starts_with((string)$raw, '%PDF');
    }
}
