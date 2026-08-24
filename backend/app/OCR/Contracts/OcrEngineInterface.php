<?php

namespace App\OCR\Contracts;

use App\OCR\OcrResult;

/**
 * Interface for OCR engines
 */
interface OcrEngineInterface
{
    /**
     * Get engine priority (lower number = higher priority)
     */
    public function getPriority(): int;

    /**
     * Check if engine supports the file
     */
    public function supports(string $mimeType, string $filePath, string $docType = ''): bool;

    /**
     * Extract text from file (simple)
     */
    public function extractText(string $filePath): string;

    /**
     * Extract text with structured result
     */
    public function extract(string $filePath, string $mimeType, string $docType = ''): OcrResult;
}
