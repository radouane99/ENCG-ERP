<?php

namespace App\OCR;

/**
 * OCR Result DTO (Data Transfer Object)
 *
 * Value Object for structured OCR extraction results.
 * Prevents array key typos and provides strict typing across controllers and services.
 */
class OcrResult
{
    public string $first_name_fr  = '';
    public string $last_name_fr   = '';
    public string $first_name_ar  = '';
    public string $last_name_ar   = '';
    public string $cne            = '';
    public string $cin            = '';
    public string $birth_date     = '';
    public string $birth_city_fr  = '';
    public string $birth_city_ar  = '';
    public string $father_name_fr = '';
    public string $father_name_ar = '';
    public string $mother_name_fr = '';
    public string $mother_name_ar = '';
    public string $address_fr     = '';
    public string $address_ar     = '';
    public string $bac_average    = '';
    public string $bac_mention    = '';
    public string $bac_type       = '';
    public string $high_school    = '';
    public string $academy        = '';
    public string $prefecture     = '';

    /**
     * Convert DTO to standard associative array for API JSON response.
     */
    public function toArray(): array
    {
        return get_object_vars($this);
    }

    /**
     * Create an empty result DTO.
     */
    public static function empty(): self
    {
        return new self();
    }
}
