<?php

namespace App\OCR\Contracts;

/**
 * Contract for all document-type parsers.
 *
 * Each parser handles ONE document type:
 *  - BacParser    → Attestation de Baccalauréat
 *  - CnieParser   → Carte Nationale d'Identité Électronique
 *  - ReleveParser → Relevé de Notes du Bac
 */
interface DocumentParserInterface
{
    /**
     * Parse raw OCR text and return a structured result array.
     *
     * @return array<string, string>  Keys: cin, cne, first_name_fr, last_name_fr, etc.
     */
    public function parse(string $text): array;
}
