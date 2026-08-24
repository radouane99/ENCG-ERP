<?php

namespace App\OCR\Contracts;

use App\OCR\OcrResult;
use App\OCR\Parsers\BacParser;
use App\OCR\Parsers\CnieParser;
use App\OCR\Parsers\ReleveParser;
use Illuminate\Support\Facades\Log;

/**
 * Manager for document parsers with fallback mechanism
 * Version Finale - Optimisée
 */
class DocumentParserManager
{
    private array $parsers = [];

    private array $parserCache = [];

    private array $config;

    public function __construct(array $config = [])
    {
        $this->config = array_merge([
            'enable_fallback' => true,
            'enable_validation' => true,
            'log_parsing_errors' => true,
        ], $config);

        // Register default parsers
        $this->registerDefaultParsers();
    }

    /**
     * Register default parsers
     */
    private function registerDefaultParsers(): void
    {
        $this->registerParser(new ReleveParser);
        $this->registerParser(new BacParser);
        $this->registerParser(new CnieParser);
    }

    /**
     * Register a parser
     */
    public function registerParser(DocumentParserInterface $parser): void
    {
        $this->parsers[] = $parser;
        $this->parserCache = [];
    }

    /**
     * Get parser for document type
     */
    public function getParser(string $docType): ?DocumentParserInterface
    {
        if (isset($this->parserCache[$docType])) {
            return $this->parserCache[$docType];
        }

        foreach ($this->parsers as $parser) {
            if ($parser->supports($docType)) {
                $this->parserCache[$docType] = $parser;

                return $parser;
            }
        }

        return null;
    }

    /**
     * Parse document with fallback mechanism
     */
    public function parse(string $docType, string $text): OcrResult
    {
        $parser = $this->getParser($docType);

        if (! $parser) {
            // Fallback: try all parsers
            return $this->parseWithFallback($text);
        }

        $result = $parser->parse($text);

        // Validate result
        if ($this->config['enable_validation']) {
            $this->validateResult($result, $docType);
        }

        return $result;
    }

    /**
     * Parse with fallback to all parsers
     */
    private function parseWithFallback(string $text): OcrResult
    {
        if (! $this->config['enable_fallback']) {
            return new OcrResult($text);
        }

        $bestResult = null;
        $bestScore = 0;

        foreach ($this->parsers as $parser) {
            try {
                $result = $parser->parse($text);
                $score = $this->scoreResult($result);

                if ($score > $bestScore) {
                    $bestScore = $score;
                    $bestResult = $result;
                    $result->setParsedField('detected_parser', get_class($parser));
                }
            } catch (\Throwable $e) {
                if ($this->config['log_parsing_errors']) {
                    Log::warning('Fallback parser failed: '.$e->getMessage());
                }

                continue;
            }
        }

        return $bestResult ?? new OcrResult($text);
    }

    /**
     * Score result quality
     */
    private function scoreResult(OcrResult $result): int
    {
        $score = 0;
        $fields = $result->fields;

        // Score based on extracted fields
        $importantFields = ['last_name_fr', 'first_name_fr', 'cin', 'cne'];
        $secondaryFields = ['birth_date', 'bac_type', 'mention', 'academy'];

        foreach ($importantFields as $field) {
            if (! empty($fields[$field])) {
                $score += 10;
            }
        }

        foreach ($secondaryFields as $field) {
            if (! empty($fields[$field])) {
                $score += 5;
            }
        }

        // Bonus for having both French and Arabic names
        if (! empty($fields['last_name_fr']) && ! empty($fields['last_name_ar'])) {
            $score += 5;
        }

        return $score;
    }

    /**
     * Validate parsing result
     */
    private function validateResult(OcrResult $result, string $docType): void
    {
        $fields = $result->fields;
        $warnings = [];

        // Check for required fields based on document type
        $requiredFields = $this->getRequiredFields($docType);

        foreach ($requiredFields as $field) {
            if (empty($fields[$field])) {
                $warnings[] = "Missing required field: {$field}";
            }
        }

        // Validate specific fields
        if (! empty($fields['cin']) && ! preg_match('/^[A-Z]{1,2}\d{5,6}$/', $fields['cin'])) {
            $warnings[] = "Invalid CIN format: {$fields['cin']}";
        }

        if (! empty($fields['cne']) && ! preg_match('/^[A-Z]\d{8,9}$/', $fields['cne'])) {
            $warnings[] = "Invalid CNE format: {$fields['cne']}";
        }

        if (! empty($fields['moyenne_bac']) && ($fields['moyenne_bac'] < 0 || $fields['moyenne_bac'] > 20)) {
            $warnings[] = "Invalid average: {$fields['moyenne_bac']}";
        }

        // Store warnings in result metadata
        if (! empty($warnings)) {
            $result->setParsedField('_validation_warnings', $warnings);
            $result->setParsedField('_validation_passed', false);
        } else {
            $result->setParsedField('_validation_passed', true);
        }
    }

    /**
     * Get required fields for document type
     */
    private function getRequiredFields(string $docType): array
    {
        return match (strtolower($docType)) {
            'releve', 'releve_notes', 'notes', 'transcript' => ['last_name_fr', 'first_name_fr'],
            'bac', 'baccalaureat', 'attestation_bac' => ['last_name_fr', 'first_name_fr', 'bac_type'],
            'cnie', 'cin', 'id_card' => ['last_name_fr', 'first_name_fr', 'cin'],
            default => ['last_name_fr', 'first_name_fr']
        };
    }

    /**
     * Get list of supported document types
     */
    public function getSupportedTypes(): array
    {
        $types = [];
        foreach ($this->parsers as $parser) {
            $reflection = new \ReflectionClass($parser);
            $className = $reflection->getShortName();
            $types[$className] = $this->getParserTypes($parser);
        }

        return $types;
    }

    /**
     * Get types supported by a parser using reflection
     */
    private function getParserTypes(DocumentParserInterface $parser): array
    {
        $reflection = new \ReflectionClass($parser);
        $property = $reflection->getProperty('supportedTypes');
        $property->setAccessible(true);

        try {
            return $property->getValue($parser);
        } catch (\ReflectionException $e) {
            return [];
        }
    }

    /**
     * Clear parser cache
     */
    public function clearCache(): void
    {
        $this->parserCache = [];
    }
}
