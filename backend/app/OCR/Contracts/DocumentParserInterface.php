<?php

namespace App\OCR\Contracts;

use App\OCR\OcrResult;

/**
 * Contract for all document-type parsers.
 *
 * Each parser handles specific regex/heuristic extraction for one document type:
 *  - CnieParser   → Carte Nationale d'Identité Électronique (Recto/Verso & MRZ)
 *  - BacParser    → Attestation de Baccalauréat (Massar CNE, Mention, Série)
 *  - ReleveParser → Relevé de Notes du Bac (Massar CNE, Note Épreuve Nationale/Régionale)
 */
interface DocumentParserInterface
{
    /**
     * Determine if this parser can process the target document type.
     *
     * @param  string  $docType  Document identifier ('cnie', 'bac', 'releve')
     */
    public function supports(string $docType): bool;

    /**
     * Parse raw OCR text into a structured, strongly-typed OcrResult DTO.
     *
     * @param  string  $text  Raw OCR text output from OcrPipeline
     */
    public function parse(string $text): OcrResult;
}
