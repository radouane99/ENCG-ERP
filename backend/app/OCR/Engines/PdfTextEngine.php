<?php

namespace App\OCR\Engines;

use App\OCR\Contracts\OcrEngineInterface;

/**
 * Tier 1 OCR Engine — Poppler pdftotext
 *
 * Best for digital PDFs (Bac certificates, Relevés de Notes).
 * NOT suitable for CNIE / scanned image-based PDFs.
 */
class PdfTextEngine implements OcrEngineInterface
{
    public function supports(string $mimeType, string $filePath, string $docType = ''): bool
    {
        // Skip for CNIE — ID cards are image-based; pdftotext returns garbled encoding artifacts
        if (in_array(strtolower($docType), ['cnie', 'cin'], true)) {
            return false;
        }

        return $this->isPdf($mimeType, $filePath);
    }

    public function extract(string $filePath, string $mimeType): string
    {
        $output = [];
        $cmd = 'pdftotext -layout -enc UTF-8 ' . escapeshellarg($filePath) . ' - 2>/dev/null';
        @exec($cmd, $output, $code);
        return implode("\n", $output);
    }

    private function isPdf(string $mimeType, string $filePath): bool
    {
        if (str_contains(strtolower($mimeType), 'pdf')) return true;
        $raw = @file_get_contents($filePath, false, null, 0, 4);
        return str_starts_with((string)$raw, '%PDF');
    }
}
