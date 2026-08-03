<?php

namespace App\OCR\Parsers;

use App\OCR\Contracts\DocumentParserInterface;
use App\OCR\Helpers\ArabicTextHelper;
use App\OCR\Helpers\FrenchNameHelper;
use App\OCR\Helpers\BacFieldsHelper;

/**
 * Relevé de Notes Parser
 *
 * Extracts academic + grade fields from the official Moroccan transcript.
 * Fields: cne, cin, first_name_fr, last_name_fr, first_name_ar, last_name_ar,
 *         bac_average, bac_mention, bac_type, high_school, academy, prefecture
 *
 * Note: birth_date / address / parents are NOT on a Relevé de Notes.
 */
class ReleveParser implements DocumentParserInterface
{
    public function __construct(
        private readonly ArabicTextHelper $arabic,
        private readonly FrenchNameHelper $french,
        private readonly BacFieldsHelper  $bacFields,
    ) {}

    public function parse(string $text): array
    {
        $result = $this->emptyResult();

        // ── CNE / Code Candidat (e.g. H148073298)
        if (preg_match('/(?:Code\s+Candidat|Code\s+Massar|CNE|Code\s+élève)\s*[:\.\-]?\s*([A-Za-z]\d{8,9}|\d{10})/i', $text, $m)) {
            $result['cne'] = strtoupper(trim($m[1]));
        } elseif (preg_match('/\b([A-Za-z]\d{8,9})\b/', $text, $m)) {
            $result['cne'] = strtoupper(trim($m[1]));
        }

        // ── CIN
        if (preg_match('/(?:CNIE|CIN|Carte\s+Nationale)\s*[:\.\-]?\s*([A-Za-z]{1,2}\d{5,8})/i', $text, $m)) {
            $cin = strtoupper(trim($m[1]));
            if ($cin !== $result['cne']) $result['cin'] = $cin;
        }

        // ── French Name: «Nom et Prénom : ENMILI FATIMA-ZAHRA»
        if (preg_match('/Nom\s+et\s+Pr[eé]nom\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-ZÉÈÊÀÙÎÔ\-\s]{2,60}?)(?=\s{2,}|\t|Code|CNIE|\n|\r|$)/u', $text, $m)) {
            $fullName = trim(preg_replace('/\s+/', ' ', $m[1]));
            $fullName = preg_replace('/\s+[A-Z]{1,2}\d{5,8}.*$/i', '', $fullName);
            $parts = preg_split('/\s+/', $fullName, 2);
            $result['last_name_fr']  = $parts[0] ?? '';
            $result['first_name_fr'] = $parts[1] ?? '';
        } else {
            $names = $this->french->extractName($text);
            $result['last_name_fr']  = $names['last_name_fr'];
            $result['first_name_fr'] = $names['first_name_fr'];
        }

        // ── Arabic Name
        $arNames = $this->arabic->extractName($text);
        $result['last_name_ar']  = $arNames['last_name_ar'];
        $result['first_name_ar'] = $arNames['first_name_ar'];

        // ── BAC Average: «MOY. GENERALE : 15.41»
        if (preg_match('/MOY[^\n\r]*?GENERALE[\s\S]{0,100}?(\b1[0-9][,\.]\d{1,3}\b|\b20[,\.]00\b)/i', $text, $m)) {
            $result['bac_average'] = str_replace(',', '.', $m[1]);
        } elseif (preg_match('/(?:MOY(?:ENNE)?|GENERALE|DECISION|JURY)[^\n\r]*?(\b1[0-9][,\.]\d{1,3}\b)/i', $text, $m)) {
            $result['bac_average'] = str_replace(',', '.', $m[1]);
        } elseif (preg_match('/(\b1[0-9]\.\d{2}\b)/', $text, $m)) {
            $result['bac_average'] = $m[1];
        }

        // ── Mention
        $result['bac_mention'] = $this->bacFields->extractBacMention($text);

        // ── Bac Type: «Niveau : 2ÈME ANNÉE BAC SCIENCES ECONOMIQUES»
        if (preg_match('/Niveau\s*[:\-]?\s*(?:2[ÈE]ME\s+ANN[EÉ]E\s+BAC\s+)?([A-ZÉÈÊÀÙÎÔ\s\-]+?)(?=\n|\r|Deuxième|$)/iu', $text, $m)) {
            $result['bac_type'] = $this->bacFields->extractBacType(trim($m[1])) ?: trim($m[1]);
        } else {
            $result['bac_type'] = $this->bacFields->extractBacType($text);
        }

        // ── Lycée: «Etablissement : LYCEE QUALIFIANT EL HASSAN ADDAKHIL»
        if (preg_match('/Etablissement\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-zÉÈÊÀÙÎÔéèêàùîô\s\'\-]+?)(?=\n|\r|Niveau|Direction|$)/iu', $text, $m)) {
            $result['high_school'] = trim(preg_replace('/\s+/', ' ', $m[1]));
        } else {
            $result['high_school'] = $this->bacFields->extractHighSchool($text);
        }

        // ── Direction Provinciale
        if (preg_match('/Direction\s+Provinciale\s*[:\-]?\s*(?:PROVINCE\s*[:\-]?)?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-zÉÈÊÀÙÎÔ\s\-]+?)(?=\n|\r|$)/iu', $text, $m)) {
            $result['prefecture'] = trim($m[1]);
        }

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
