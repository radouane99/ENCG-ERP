<?php

namespace App\OCR\Parsers;

use App\OCR\Contracts\DocumentParserInterface;
use App\OCR\Helpers\ArabicTextHelper;
use App\OCR\Helpers\FrenchNameHelper;
use App\OCR\Helpers\BacFieldsHelper;

/**
 * BAC Parser — Attestation de Baccalauréat
 *
 * Extracts ONLY academic identification fields — not grades.
 * Fields: cne, cin, first_name_fr, last_name_fr, first_name_ar, last_name_ar,
 *         bac_type, bac_mention, academy, prefecture, high_school
 */
class BacParser implements DocumentParserInterface
{
    public function __construct(
        private readonly ArabicTextHelper $arabic,
        private readonly FrenchNameHelper $french,
        private readonly BacFieldsHelper  $bacFields,
    ) {}

    public function parse(string $text): array
    {
        $result = $this->emptyResult();

        // ── CNE / Code Massar (letter + 8-9 digits, e.g. H148073298)
        if (preg_match('/(?:CNE|Code\s+Massar|Code\s+Candidat|Massar|élève|Candidat)\s*[:\.\-]?\s*([A-Za-z]\d{8,9}|\d{10})/i', $text, $m)) {
            $result['cne'] = strtoupper(trim($m[1]));
        } elseif (preg_match('/\b([A-Za-z]\d{8,9})\b/', $text, $m)) {
            $result['cne'] = strtoupper(trim($m[1]));
        }

        // ── CIN (e.g. ZG195334)
        if (preg_match('/(?:Num[eé]ro\s+de\s+la\s+Carte\s+Nationale|Carte\s+Nationale\s+d[\'\'"]Identit[eé]|Carte\s+Nationale|CIN|CNIE)\s*(?:\(\*\))?\s*[:\.\-]?\s*([A-Za-z]{1,2}\d{5,8})/i', $text, $m)) {
            $cin = strtoupper(trim($m[1]));
            if ($cin !== $result['cne']) $result['cin'] = $cin;
        } elseif (preg_match('/\b([A-Za-z]{1,2}\d{5,8})\b/', $text, $m)) {
            $candidate = strtoupper(trim($m[1]));
            if ($candidate !== $result['cne']) $result['cin'] = $candidate;
        }

        // ── French Name
        $names = $this->french->extractName($text);
        $result['last_name_fr']  = $names['last_name_fr'];
        $result['first_name_fr'] = $names['first_name_fr'];

        // ── Arabic Name
        $arNames = $this->arabic->extractName($text);
        $result['last_name_ar']  = $arNames['last_name_ar'];
        $result['first_name_ar'] = $arNames['first_name_ar'];

        // ── Bac Type (filière)
        $result['bac_type'] = $this->bacFields->extractBacType($text);

        // ── Bac Mention
        $result['bac_mention'] = $this->bacFields->extractBacMention($text);

        // ── Academy
        if (preg_match('/ACAD[EÉ]MIE\s+R[EÉ]GIONALE\s+D[\'\'"]E?DUCATION[^\n\r]*?\s+([A-ZÉÈÊÀÙÎÔ\s\-]{3,30})/iu', $text, $m)) {
            $result['academy'] = 'ACADÉMIE ' . trim($m[1]);
        } elseif (preg_match('/أكاديمية\s+([\x{0600}-\x{06FF}\s]+)/u', $text, $m)) {
            $result['academy'] = 'أكاديمية ' . trim($m[1]);
        }

        // ── Prefecture / Province
        if (preg_match('/(?:Direction\s+Provinciale|Province|Préfecture)\s*[:\-]?\s*(?:PROVINCE\s*[:\-]?)?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-zÉÈÊÀÙÎÔ\s\-]+?)(?=\n|\r|$|e\b)/iu', $text, $m)) {
            $result['prefecture'] = trim($m[1]);
        } elseif (preg_match('/إقليم\s*[:\-]?\s*([\x{0600}-\x{06FF}\s]+)/u', $text, $m)) {
            $result['prefecture'] = trim($m[1]);
        }

        // ── Lycée / High School
        $result['high_school'] = $this->bacFields->extractHighSchool($text);

        return $result;
    }

    private function emptyResult(): array
    {
        return [
            'first_name_fr' => '', 'last_name_fr'   => '',
            'first_name_ar' => '', 'last_name_ar'   => '',
            'cne'           => '', 'cin'            => '',
            'birth_date'    => '', 'birth_city_fr'  => '',
            'birth_city_ar' => '', 'father_name_fr' => '',
            'father_name_ar'=> '', 'mother_name_fr' => '',
            'mother_name_ar'=> '', 'address_fr'     => '',
            'address_ar'    => '', 'bac_average'    => '',
            'bac_mention'   => '', 'bac_type'       => '',
            'high_school'   => '', 'academy'        => '',
            'prefecture'    => '',
        ];
    }
}
