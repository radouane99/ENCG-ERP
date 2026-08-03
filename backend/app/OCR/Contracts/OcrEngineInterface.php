<?php

namespace App\OCR\Contracts;

/**
 * Contract for all OCR text extraction engines.
 *
 * Each engine is responsible for a single extraction strategy:
 *  - PdfTextEngine  → Poppler pdftotext (digital PDFs)
 *  - TesseractEngine → Tesseract OCR (image-based PDFs, CNIE)
 *  - PdfBinaryEngine → Raw PDF binary stream fallback
 */
interface OcrEngineInterface
{
    /**
     * Determine if this engine can handle the given file.
     */
    public function supports(string $mimeType, string $filePath, string $docType = ''): bool;

    /**
     * Extract raw text from the given file.
     */
    public function extract(string $filePath, string $mimeType): string;
}
