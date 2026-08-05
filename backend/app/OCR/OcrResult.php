<?php

namespace App\OCR;

/**
 * OCR Result Data Transfer Object
 * Version Finale - Optimisée
 */
class OcrResult
{
    public string $text;
    public array $fields = [];
    public array $metadata = [];

    public function __construct(string $text)
    {
        $this->text = $text;
        $this->metadata = [
            'processed_at' => date('Y-m-d H:i:s'),
            'text_length' => strlen($text),
        ];
    }

    /**
     * Set a parsed field
     */
    public function setParsedField(string $key, $value): self
    {
        // Handle nested fields with dot notation
        if (strpos($key, '.') !== false) {
            $keys = explode('.', $key);
            $current = &$this->fields;
            
            foreach ($keys as $k) {
                if (!isset($current[$k]) || !is_array($current[$k])) {
                    $current[$k] = [];
                }
                $current = &$current[$k];
            }
            $current = $value;
        } else {
            $this->fields[$key] = $value;
        }

        return $this;
    }

    /**
     * Get a parsed field
     */
    public function getParsedField(string $key, $default = null)
    {
        // Handle nested fields with dot notation
        if (strpos($key, '.') !== false) {
            $keys = explode('.', $key);
            $current = $this->fields;
            
            foreach ($keys as $k) {
                if (!isset($current[$k])) {
                    return $default;
                }
                $current = $current[$k];
            }
            return $current;
        }

        return $this->fields[$key] ?? $default;
    }

    /**
     * Check if a field exists
     */
    public function hasField(string $key): bool
    {
        return $this->getParsedField($key, null) !== null;
    }

    /**
     * Get all fields
     */
    public function getFields(): array
    {
        return $this->fields;
    }

    /**
     * Get text
     */
    public function getText(): string
    {
        return $this->text;
    }

    /**
     * Set metadata
     */
    public function setMetadata(string $key, $value): self
    {
        $this->metadata[$key] = $value;
        return $this;
    }

    /**
     * Get metadata
     */
    public function getMetadata(string $key = null, $default = null)
    {
        if ($key === null) {
            return $this->metadata;
        }
        return $this->metadata[$key] ?? $default;
    }

    /**
     * Check if parsing was successful
     */
    public function isSuccess(): bool
    {
        // Check if we have at least some fields extracted
        $importantFields = ['last_name_fr', 'first_name_fr', 'cin', 'cne'];
        
        foreach ($importantFields as $field) {
            if (!empty($this->getParsedField($field))) {
                return true;
            }
        }

        // Or if we have text
        return !empty(trim($this->text));
    }

    /**
     * Get confidence score
     */
    public function getConfidence(): float
    {
        return $this->getParsedField('_confidence', 0.0);
    }

    /**
     * Get validation warnings
     */
    public function getValidationWarnings(): array
    {
        return $this->getParsedField('_validation_warnings', []);
    }

    /**
     * Check if validation passed
     */
    public function validationPassed(): bool
    {
        return $this->getParsedField('_validation_passed', false);
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'text' => $this->text,
            'fields' => $this->fields,
            'metadata' => $this->metadata,
            'success' => $this->isSuccess(),
            'confidence' => $this->getConfidence(),
            'validation_passed' => $this->validationPassed(),
        ];
    }

    /**
     * Convert to JSON
     */
    public function toJson(): string
    {
        return json_encode($this->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Merge another result into this one
     */
    public function merge(OcrResult $other): self
    {
        $this->fields = array_merge($this->fields, $other->fields);
        $this->metadata = array_merge($this->metadata, $other->metadata);
        
        // Keep longer text
        if (strlen($other->text) > strlen($this->text)) {
            $this->text = $other->text;
        }
        
        return $this;
    }
}