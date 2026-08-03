<?php

namespace App\OCR\Helpers;

/**
 * French Name Extractor Helper
 *
 * Extracts French first/last name from multiple OCR label patterns:
 *  - Baccalauréat: «Que le(a) candidat(e) : ENMILI FATIMA-ZAHRA»
 *  - Combined:     «Nom et Prénom : ENMILI FATIMA-ZAHRA»
 *  - Separate:     «Nom : ENMILI  Prénom : FATIMA-ZAHRA»
 */
class FrenchNameHelper
{
    /**
     * Extract French last_name_fr and first_name_fr from labelled OCR text.
     *
     * @return array{last_name_fr: string, first_name_fr: string}
     */
    public function extractName(string $text): array
    {
        $last  = '';
        $first = '';

        // Pattern 1 — BAC: «Que le(a) candidat(e) : ENMILI FATIMA-ZAHRA»
        if (preg_match(
            '/(?:Que\s+le\(a\)\s+candidat\(e\)|candidat\(e\))\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-ZÉÈÊÀÙÎÔ\-\s]{2,60}?)(?=\s{2,}|\t|\n|\r|Num[eé]ro|Carte|CNE|CIN|Code|N[°o]|$)/u',
            $text, $m
        )) {
            [$last, $first] = $this->splitFullName($m[1]);

        // Pattern 2 — Combined: «Nom et Prénom : ENMILI FATIMA-ZAHRA»
        } elseif (preg_match(
            '/Nom\s+et\s+Pr[eé]nom\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-ZÉÈÊÀÙÎÔ\-\s]{2,60}?)(?=\s{2,}|\t|\n|\r|CNE|CIN|Code|N[°o]|$)/u',
            $text, $m
        )) {
            [$last, $first] = $this->splitFullName($m[1]);

        // Pattern 3 — Separate: «Nom : ENMILI  Prénom : FATIMA-ZAHRA»
        } elseif (preg_match(
            '/\bNom\b\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-ZÉÈÊÀÙÎÔ\-\s]{1,40}?)(?=\s{2,}|\t|Pr[eé]nom|\n|\r|$)/iu',
            $text, $m
        )) {
            $last = trim($m[1]);
            if (preg_match('/Pr[eé]nom\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-ZÉÈÊÀÙÎÔ\-\s]{1,40}?)(?=\s{2,}|\t|\n|\r|$)/iu', $text, $m2)) {
                $first = trim($m2[1]);
            }
        }

        return ['last_name_fr' => $last, 'first_name_fr' => $first];
    }

    /**
     * Split «ENMILI FATIMA-ZAHRA» into ['ENMILI', 'FATIMA-ZAHRA'].
     *
     * @return array{string, string}
     */
    private function splitFullName(string $fullName): array
    {
        $clean = trim(preg_replace('/\s+/', ' ', $fullName));
        // Strip any trailing CIN/CNE code that OCR may have included
        $clean = preg_replace('/\s+[A-Z]{1,2}\d{5,8}.*$/i', '', $clean);
        $parts = preg_split('/\s+/', $clean, 2);
        return [$parts[0] ?? '', $parts[1] ?? ''];
    }
}
