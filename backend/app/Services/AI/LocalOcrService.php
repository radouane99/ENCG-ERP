<?php

namespace App\Services\AI;

use App\OCR\OcrPipeline;
use App\OCR\OcrResult;
use App\OCR\Contracts\DocumentParserInterface;
use App\OCR\Engines\PdfBinaryEngine;
use App\OCR\Engines\PdfTextEngine;
use App\OCR\Engines\TesseractEngine;
use App\OCR\Parsers\BacParser;
use App\OCR\Parsers\CnieParser;
use App\OCR\Parsers\ReleveParser;
use Illuminate\Support\Facades\Log;

/**
 * LocalOcrService — 100% FREE, 100% LOCAL OCR
 *
 * SOLID Architecture Facade:
 *  - Uses OcrPipeline Strategy Chain (PdfText → Tesseract → PdfBinary)
 *  - Uses Laravel Container Dependency Injection for Document Parsers
 *  - Returns array matching OcrResult DTO
 */
class LocalOcrService
{
    public ?string $lastError = null;

    private OcrPipeline $pipeline;

    /**
     * Dependency Injection via Laravel Service Container
     */
    public function __construct(
        private readonly BacParser    $bacParser,
        private readonly CnieParser   $cnieParser,
        private readonly ReleveParser $releveParser,
        PdfTextEngine                 $pdfTextEngine,
        TesseractEngine               $tesseractEngine,
        PdfBinaryEngine               $pdfBinaryEngine,
    ) {
        $this->pipeline = new OcrPipeline();
        $this->pipeline
            ->addEngine($pdfTextEngine)
            ->addEngine($tesseractEngine)
            ->addEngine($pdfBinaryEngine);
    }

    /**
     * Main entry point — mirrors GeminiApiService::extractDocumentOcr()
     *
     * @return array<string, string> Standardised extraction result
     */
    public function extractDocumentOcr(
        string $filePath,
        string $mimeType,
        ?string $originalName = null,
        string $docType = 'bac'
    ): array {
        $docType = strtolower($docType);

        if (!file_exists($filePath)) {
            $this->lastError = 'File not found: ' . $filePath;
            return OcrResult::empty()->toArray();
        }

        Log::info("[LocalOCR] Processing docType={$docType} | mime={$mimeType} | file={$originalName}");

        // ── Extract raw text via Strategy Chain Pipeline
        $text = $this->pipeline->process($filePath, $mimeType, $docType);

        if (strlen(trim($text)) < 20) {
            $this->lastError = 'Not enough text extracted for local parsing';
            return OcrResult::empty()->toArray();
        }

        Log::info('[LocalOCR] Extracted ' . strlen($text) . ' chars. FULL TEXT: ' . $text);

        // ── Debug logging
        @file_put_contents(
            storage_path('logs/ocr_debug.txt'),
            "=== " . date('Y-m-d H:i:s') . " docType={$docType} file={$originalName} ===\n" .
            "RAW_TEXT:\n" . $text . "\n=========================================\n\n",
            FILE_APPEND
        );

        // ── Route to injected Document Parser
        $parser = $this->resolveParser($docType);
        $result = $parser->parse($text);

        Log::info('[LocalOCR] Parsed result:', $result);
        @file_put_contents(
            storage_path('logs/ocr_debug.txt'),
            "PARSED_RESULT:\n" . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n-----------------------------------------\n\n",
            FILE_APPEND
        );

        $this->lastError = null;
        return $result;
    }

    /**
     * Resolve injected parser instance by docType.
     */
    private function resolveParser(string $docType): DocumentParserInterface
    {
        return match ($docType) {
            'releve', 'releve_notes', 'notes' => $this->releveParser,
            'cnie', 'cin'                     => $this->cnieParser,
            default                           => $this->bacParser,
        };
    }
}
