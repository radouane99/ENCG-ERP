<?php

namespace App\OCR\Engines;

use App\OCR\Contracts\OcrEngineInterface;
use App\OCR\OcrResult;
use Illuminate\Support\Facades\Log;
use Throwable;

class PdfBinaryEngine implements OcrEngineInterface
{
    public function getPriority(): int
    {
        return 2;
    }

    public function supports(string $mimeType, string $filePath, string $docType = ''): bool
    {
        return str_contains(strtolower($mimeType), 'pdf') 
            || str_ends_with(strtolower($filePath), '.pdf');
    }

    public function extractText(string $filePath): string
    {
        $mimeType = mime_content_type($filePath) ?: 'application/pdf';
        $result = $this->extract($filePath, $mimeType, '');
        return $result->text;
    }

    public function extract(string $filePath, string $mimeType, string $docType = ''): OcrResult
    {
        if (!file_exists($filePath)) {
            Log::warning("[PdfBinaryEngine] File not found: {$filePath}");
            return new OcrResult('');
        }

        try {
            // Use pdftotext with both layout and raw options
            $output = [];
            $returnVar = -1;
            
            // Try with layout first
            $command = sprintf('pdftotext -layout -nopgbrk %s - 2>/dev/null', escapeshellarg($filePath));
            @exec($command, $output, $returnVar);

            $text = implode("\n", $output);

            // If result is empty, try without layout
            if ($returnVar !== 0 || empty(trim($text))) {
                $output = [];
                $command = sprintf('pdftotext %s - 2>/dev/null', escapeshellarg($filePath));
                @exec($command, $output, $returnVar);
                $text = implode("\n", $output);
            }

            // If still empty, try with pdftohtml as fallback
            if (empty(trim($text))) {
                $text = $this->extractWithPdfToHtml($filePath);
            }

            return new OcrResult(trim($text));

        } catch (Throwable $e) {
            Log::warning("[PdfBinaryEngine] Extraction failed: " . $e->getMessage());
            return new OcrResult('');
        }
    }

    /**
     * Fallback extraction using pdftohtml
     */
    private function extractWithPdfToHtml(string $filePath): string
    {
        $tmpDir = sys_get_temp_dir();
        $tmpFile = $tmpDir . '/pdfhtml_' . uniqid() . '.html';
        
        $command = sprintf('pdftohtml -noframes -s -i %s %s 2>/dev/null', 
            escapeshellarg($filePath), 
            escapeshellarg($tmpFile)
        );
        
        @exec($command);

        if (file_exists($tmpFile)) {
            $html = file_get_contents($tmpFile);
            @unlink($tmpFile);
            
            // Extract text from HTML
            $text = strip_tags($html);
            return trim($text);
        }

        return '';
    }
}