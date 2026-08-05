<?php

namespace App\OCR\Contracts;

use App\OCR\OcrPipeline;
use App\OCR\OcrResult;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Document Processing Service - Orchestrates OCR and Parsing
 * Version Finale - Optimisée
 */
class DocumentProcessingService
{
    private OcrPipeline $pipeline;
    private DocumentParserManager $parserManager;
    private array $config;

    public function __construct(
        OcrPipeline $pipeline,
        DocumentParserManager $parserManager,
        array $config = []
    ) {
        $this->pipeline = $pipeline;
        $this->parserManager = $parserManager;
        $this->config = array_merge([
            'auto_detect_type' => true,
            'enable_cache' => true,
            'cache_ttl' => 3600,
            'max_file_size' => 10 * 1024 * 1024, // 10MB
            'allowed_mime_types' => [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/tiff',
            ],
        ], $config);
    }

    /**
     * Process document and extract structured data
     */
    public function process(string $filePath, string $docType = ''): OcrResult
    {
        $this->validateFile($filePath);

        try {
            // Step 1: Perform OCR
            $ocrResult = $this->pipeline->process($filePath, $docType);
            
            if (empty($ocrResult->text)) {
                return $this->createErrorResult('No text extracted from document', $filePath);
            }

            // Step 2: Auto-detect document type if not provided
            if (empty($docType) && $this->config['auto_detect_type']) {
                $docType = $this->detectDocumentType($ocrResult->text);
            }

            // Step 3: Parse document
            $parsedResult = $this->parserManager->parse($docType, $ocrResult->text);
            
            // Step 4: Merge results
            $parsedResult->text = $ocrResult->text;
            $parsedResult->setParsedField('_source_file', basename($filePath));
            $parsedResult->setParsedField('_doc_type', $docType);
            $parsedResult->setParsedField('_ocr_engines_used', $ocrResult->metadata['engines_used'] ?? []);

            return $parsedResult;

        } catch (Throwable $e) {
            Log::error("Document processing failed: " . $e->getMessage(), [
                'file' => $filePath,
                'doc_type' => $docType,
                'trace' => $e->getTraceAsString()
            ]);

            return $this->createErrorResult($e->getMessage(), $filePath);
        }
    }

    /**
     * Process multiple documents
     */
    public function processBatch(array $files, string $docType = ''): array
    {
        $results = [];

        foreach ($files as $filePath) {
            $results[$filePath] = $this->process($filePath, $docType);
        }

        return $results;
    }

    /**
     * Validate file before processing
     */
    private function validateFile(string $filePath): void
    {
        if (!file_exists($filePath)) {
            throw new \InvalidArgumentException("File does not exist: {$filePath}");
        }

        $fileSize = filesize($filePath);
        if ($fileSize > $this->config['max_file_size']) {
            throw new \InvalidArgumentException(
                sprintf("File size (%d bytes) exceeds limit (%d bytes)", 
                    $fileSize, 
                    $this->config['max_file_size']
                )
            );
        }

        $mimeType = mime_content_type($filePath) ?: '';
        if (!in_array($mimeType, $this->config['allowed_mime_types'])) {
            throw new \InvalidArgumentException(
                "Unsupported mime type: {$mimeType}. Allowed: " . 
                implode(', ', $this->config['allowed_mime_types'])
            );
        }
    }

    /**
     * Auto-detect document type from text content
     */
    private function detectDocumentType(string $text): string
    {
        $patterns = [
            'cnie' => [
                '/CARTE\s+NATIONALE/i',
                '/CNIE/i',
                '/CIN\s+N°/i',
                '/بطاقة\s+الوطنية/u',
                '/IDMAR[A-Z0-9<]{10,}/i', // MRZ pattern
            ],
            'releve' => [
                '/RELEVÉ\s+DE\s+NOTES/i',
                '/RELEVE\s+DES\s+NOTES/i',
                '/EXAMEN\s+REGIONAL/i',
                '/EXAMEN\s+NATIONAL/i',
                '/MOYENNE\s+GENERALE/i',
            ],
            'bac' => [
                '/BACCALAURÉAT/i',
                '/BACCALAUREAT/i',
                '/DIPLÔME\s+DU\s+BACCALAUREAT/i',
                '/ATTESTATION\s+DE\s+RÉUSSITE/i',
                '/SESSION\s+(NORMALE|RATTRAPAGE)/i',
            ],
        ];

        $scores = [];
        foreach ($patterns as $type => $typePatterns) {
            $score = 0;
            foreach ($typePatterns as $pattern) {
                if (preg_match($pattern, $text)) {
                    $score += 10;
                }
            }
            $scores[$type] = $score;
        }

        // Get type with highest score
        arsort($scores);
        $bestType = key($scores);
        $bestScore = reset($scores);

        // Return default if score is too low
        return ($bestScore >= 10) ? $bestType : 'unknown';
    }

    /**
     * Create error result
     */
    private function createErrorResult(string $error, string $filePath): OcrResult
    {
        $result = new OcrResult('');
        $result->setParsedField('_error', $error);
        $result->setParsedField('_source_file', basename($filePath));
        $result->setParsedField('_success', false);
        return $result;
    }

    /**
     * Get processing statistics
     */
    public function getStats(): array
    {
        return [
            'supported_types' => $this->parserManager->getSupportedTypes(),
            'config' => $this->config,
        ];
    }

    /**
     * Update configuration
     */
    public function setConfig(array $config): void
    {
        $this->config = array_merge($this->config, $config);
    }
}