<?php

namespace App\OCR\Engines;

use App\OCR\Contracts\OcrEngineInterface;
use App\OCR\OcrResult;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class PdfTextEngine implements OcrEngineInterface
{
    public function getPriority(): int
    {
        return 1;
    }

    public function supports(string $mimeType, string $filePath, string $docType = ''): bool
    {
        return str_contains(strtolower($mimeType), 'pdf') 
            || str_ends_with(strtolower($filePath), '.pdf');
    }

    public function extractText(string $filePath): string
    {
        if (!file_exists($filePath)) {
            return '';
        }

        $output = [];
        $returnVar = -1;
        
        // Try with UTF-8 encoding
        $command = sprintf('pdftotext -layout -enc UTF-8 %s - 2>/dev/null', escapeshellarg($filePath));
        @exec($command, $output, $returnVar);

        $text = implode("\n", $output);

        // If UTF-8 fails, try without encoding
        if ($returnVar !== 0 || empty(trim($text))) {
            $output = [];
            $command = sprintf('pdftotext -layout %s - 2>/dev/null', escapeshellarg($filePath));
            @exec($command, $output, $returnVar);
            $text = implode("\n", $output);
        }

        if ($returnVar !== 0 || empty(trim($text))) {
            Log::info("[PdfTextEngine] pdftotext returned empty text for {$filePath}. Requesting fallback.");
            throw new RuntimeException("pdftotext returned empty string or failed execution.");
        }

        return $text;
    }

    public function extract(string $filePath, string $mimeType, string $docType = ''): OcrResult
    {
        try {
            $text = $this->extractText($filePath);
            return new OcrResult(trim($text));
        } catch (Throwable $e) {
            Log::warning("[PdfTextEngine] Extraction failed: " . $e->getMessage());
            return new OcrResult('');
        }
    }
}