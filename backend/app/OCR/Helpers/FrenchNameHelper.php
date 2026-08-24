<?php

namespace App\OCR\Helpers;

/**
 * French Name Extractor Helper
 *
 * Extracts French first/last name from multiple OCR label patterns:
 *  - Baccalauréat: «Que le(a) candidat(e) : EL ASRI RADOUANE»
 *  - Massar / Relevé: «Nom et Prénom : EL ASRI RADOUANE»
 *  - Separate: «Nom : EL ASRI  Prénom : RADOUANE»
 *  - CNIE / Identity Card layouts
 *  - Various document formats with OCR noise tolerance
 *
 * @version 2.0 Final
 */
class FrenchNameHelper
{
    /**
     * Common Moroccan / French compound surname prefixes.
     */
    private array $surnamePrefixes = [
        'EL', 'AL', 'BEN', 'IBN', 'AIT', 'AYT', 'OU', 'ABOU', 'ABD', 'BENI', 'BOU',
        'ME', 'MO', 'MA', 'MOHAMED', 'AHMED', 'ABDEL', 'ABDERRAHMAN', 'ABDERRAHIM',
        'DE', 'DU', 'DES', 'DE LA', 'LE', 'LA', 'LES',
    ];

    /**
     * Common administrative stop-words that accidentally get captured.
     */
    private array $stopWords = [
        'NE', 'NEE', 'NÉE', 'NÉ', 'LE', 'À', 'A', 'CODE', 'CNE', 'CIN', 'MASSAR',
        'SESSION', 'NE(E)', 'NÉ(E)', 'DU', 'DANS', 'AU', 'BAC', 'FILIERE', 'SERIE',
        'N°', 'NO', 'NUMERO', 'NUMÉRO', 'DATE', 'LIEU', 'NAISSANCE', 'NATIONALITE',
        'SEXE', 'M', 'F', 'MASCULIN', 'FEMININ',
    ];

    /**
     * Common OCR errors and their corrections
     */
    private array $ocrCorrections = [
        'O' => '0',
        'I' => '1',
        'L' => '1',
        'S' => '5',
        'B' => '8',
        'G' => '6',
        'Z' => '2',
    ];

    /**
     * Extract French last_name_fr and first_name_fr from labelled OCR text.
     *
     * @return array{last_name_fr: string, first_name_fr: string}
     */
    public function extractName(string $text): array
    {
        $last = '';
        $first = '';

        // Clean unicode spaces and double spaces
        $normalizedText = preg_replace('/[^\S\r\n]+/u', ' ', $text);

        // Remove OCR noise
        $normalizedText = $this->cleanOcrNoise($normalizedText);

        // Pattern 1 — BAC: «Que le(a) candidat(e) : EL ASRI RADOUANE»
        if (preg_match(
            '/(?:Que\s+le\(a\)\s+candidat\(e\)|candidat\(e\)|candidat|CANDIDAT)\s*[:\-]?\s*([a-zA-ZÀ-ÿ\-\'\s]{2,60}?)(?=\s{2,}|\t|\n|\r|N[eé]\(?e\)?\s+le|Num[eé]ro|Carte|CNE|CIN|Code|N[°o]|$)/iu',
            $normalizedText, $m
        )) {
            [$last, $first] = $this->splitFullName($m[1]);

            // Pattern 2 — Combined: «Nom et Prénom : EL ASRI RADOUANE» or «Nom & Prénom»
        } elseif (preg_match(
            '/(?:Nom\s+(?:et|&|\/)\s*Pr[eé]nom(?:s)?|Nom\s*Pr[eé]nom|NOM\s*ET\s*PRENOM)\s*[:\-]?\s*([a-zA-ZÀ-ÿ\-\'\s]{2,60}?)(?=\s{2,}|\t|\n|\r|N[eé]\(?e\)?\s+le|CNE|CIN|Code|N[°o]|$)/iu',
            $normalizedText, $m
        )) {
            [$last, $first] = $this->splitFullName($m[1]);

            // Pattern 3 — Separate: «Nom : EL ASRI» + «Prénom : RADOUANE»
        } elseif (preg_match(
            '/\bNom\b\s*[:\-]?\s*([a-zA-ZÀ-ÿ\-\'\s]{1,40}?)(?=\s{2,}|\t|Pr[eé]nom|\n|\r|$)/iu',
            $normalizedText, $m
        )) {
            $last = $this->cleanTokenString($m[1]);

            if (preg_match('/Pr[eé]nom(?:s)?\s*[:\-]?\s*([a-zA-ZÀ-ÿ\-\'\s]{1,40}?)(?=\s{2,}|\t|\n|\r|$)/iu', $normalizedText, $m2)) {
                $first = $this->cleanTokenString($m2[1]);
            }
        }

        // Pattern 4 — CNIE / Standalone fallback for structured lines
        if (empty($last) && empty($first)) {
            if (preg_match('/(?:Nom\s+de\s+famille|Nom|NOM)\s*[:\-]?\s*([a-zA-ZÀ-ÿ\-\'\s]{2,40})/iu', $normalizedText, $m)) {
                $last = $this->cleanTokenString($m[1]);
            }
            if (preg_match('/(?:Pr[eé]nom|PRENOM)\s*[:\-]?\s*([a-zA-ZÀ-ÿ\-\'\s]{2,40})/iu', $normalizedText, $m)) {
                $first = $this->cleanTokenString($m[1]);
            }
        }

        // Pattern 5 — Extract from "NOM PRENOM" format (common in documents)
        if (empty($last) && empty($first)) {
            if (preg_match('/(?:^|\n|\r)\s*([A-Z]{2,15})\s+([A-Z][a-z]{2,15}(?:\s+[A-Z][a-z]{2,15})?)/', $normalizedText, $m)) {
                $last = $this->cleanTokenString($m[1]);
                $first = $this->cleanTokenString($m[2]);
            }
        }

        // Pattern 6 — Extract from "Nom: XXXX" where XXXX is all caps
        if (empty($last) && empty($first)) {
            if (preg_match('/\bNom\s*:\s*([A-Z]{2,20}(?:\s+[A-Z]{2,20}){0,2})/iu', $normalizedText, $m)) {
                $tokens = explode(' ', $m[1]);
                if (count($tokens) >= 2) {
                    $last = $tokens[0];
                    $first = implode(' ', array_slice($tokens, 1));
                } else {
                    $last = $m[1];
                }
            }
        }

        // Final cleanup and normalization
        $last = $this->normalizeName($last);
        $first = $this->normalizeName($first);

        // If first name is empty but we have a last name, try to split
        if (! empty($last) && empty($first)) {
            $tokens = explode(' ', $last);
            if (count($tokens) >= 2) {
                // Check if the first token looks like a first name
                $firstToken = $tokens[0];
                $lastToken = implode(' ', array_slice($tokens, 1));

                // If first token is lowercase, it's probably a prefix
                if (strtoupper($firstToken) === $firstToken) {
                    // All caps - could be last name
                    $last = $lastToken;
                    $first = $firstToken;
                }
            }
        }

        return [
            'last_name_fr' => mb_strtoupper($last, 'UTF-8'),
            'first_name_fr' => mb_strtoupper($first, 'UTF-8'),
        ];
    }

    /**
     * Intelligently split full name considering Moroccan prefixes (EL, BEN, AIT, etc.)
     *
     * @return array{string, string}
     */
    public function splitFullName(string $fullName): array
    {
        $clean = $this->cleanTokenString($fullName);
        if (empty($clean)) {
            return ['', ''];
        }

        // Strip trailing CNE/CIN identifiers (e.g. N138012345 or CD123456)
        $clean = preg_replace('/\s+[A-Z]{1,2}\d{5,8}.*$/i', '', $clean);
        $clean = preg_replace('/\s+\d{8,10}.*$/i', '', $clean);

        // Strip date patterns
        $clean = preg_replace('/\s+\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}.*$/i', '', $clean);

        $tokens = preg_split('/\s+/', $clean);
        $tokens = array_values(array_filter($tokens));
        $count = count($tokens);

        if ($count === 0) {
            return ['', ''];
        }
        if ($count === 1) {
            return [$tokens[0], ''];
        }

        // Handle compound family name prefixes (e.g. "EL ASRI", "BEN JELLOUN", "AIT BEN ALI")
        $firstTokenUpper = mb_strtoupper($tokens[0], 'UTF-8');

        if (in_array($firstTokenUpper, $this->surnamePrefixes, true) && isset($tokens[1])) {
            $secondTokenUpper = mb_strtoupper($tokens[1], 'UTF-8');

            // Handle double prefix like "AIT BEN"
            if (in_array($secondTokenUpper, $this->surnamePrefixes, true) && isset($tokens[2])) {
                // Check if third token also looks like a prefix
                $thirdTokenUpper = mb_strtoupper($tokens[2], 'UTF-8');
                if (in_array($thirdTokenUpper, $this->surnamePrefixes, true) && isset($tokens[3])) {
                    $lastName = $tokens[0].' '.$tokens[1].' '.$tokens[2].' '.$tokens[3];
                    $firstName = implode(' ', array_slice($tokens, 4));
                } else {
                    $lastName = $tokens[0].' '.$tokens[1].' '.$tokens[2];
                    $firstName = implode(' ', array_slice($tokens, 3));
                }
            } else {
                $lastName = $tokens[0].' '.$tokens[1];
                $firstName = implode(' ', array_slice($tokens, 2));
            }
        } else {
            // Check if the last token might be a first name
            $lastToken = $tokens[$count - 1];
            if (strlen($lastToken) <= 2 && count($tokens) > 2) {
                // Last token is probably an initial, use previous token as first name
                $lastName = $tokens[0];
                $firstName = implode(' ', array_slice($tokens, 1, -1));
            } else {
                $lastName = $tokens[0];
                $firstName = implode(' ', array_slice($tokens, 1));
            }
        }

        // Clean up empty first name
        if (empty(trim($firstName))) {
            $firstName = '';
        }

        return [$lastName, $firstName];
    }

    /**
     * Remove trailing noise, dates, and administrative stop-words.
     */
    private function cleanTokenString(string $input): string
    {
        $clean = trim(preg_replace('/\s+/', ' ', $input));

        // Cut string if "Né(e) le" or date patterns appear
        $clean = preg_replace('/\s+(?:N[eé]\(?e\)?\s+le|N[eé]\s+à|le|d[eu]|à)\s+\d{2}[\/\.-]\d{2}[\/\.-]\d{4}.*$/iu', '', $clean);
        $clean = preg_replace('/\s+\d{2}[\/\.-]\d{2}[\/\.-]\d{4}.*$/i', '', $clean);
        $clean = preg_replace('/\s+\d{8,10}.*$/i', '', $clean);

        // Filter individual stop-words at the end of the extracted text
        $words = preg_split('/\s+/', $clean);
        while (! empty($words)) {
            $lastWord = mb_strtoupper(end($words), 'UTF-8');
            if (in_array($lastWord, $this->stopWords, true) || preg_match('/^\d+$/', $lastWord)) {
                array_pop($words);
            } else {
                break;
            }
        }

        return implode(' ', $words);
    }

    /**
     * Normalize name (remove special characters, normalize accents)
     */
    private function normalizeName(string $name): string
    {
        if (empty($name)) {
            return '';
        }

        // Remove excessive spaces
        $name = preg_replace('/\s+/', ' ', $name);

        // Remove special characters except hyphens, apostrophes
        $name = preg_replace('/[^a-zA-ZÀ-ÿ\s\-\']/', '', $name);

        // Remove leading/trailing spaces
        $name = trim($name);

        return $name;
    }

    /**
     * Clean OCR noise from text
     */
    private function cleanOcrNoise(string $text): string
    {
        // Correct common OCR errors
        $text = str_replace(array_keys($this->ocrCorrections), array_values($this->ocrCorrections), $text);

        // Remove excessive punctuation
        $text = preg_replace('/[^\w\s\.\,\-\'\:]/u', ' ', $text);

        // Normalize multiple spaces
        $text = preg_replace('/\s+/', ' ', $text);

        return $text;
    }

    /**
     * Check if a string is likely a French name
     */
    public function isLikelyFrenchName(string $text): bool
    {
        $text = trim($text);
        if (empty($text)) {
            return false;
        }

        // Contains only French letters, spaces, hyphens, apostrophes
        if (! preg_match('/^[a-zA-ZÀ-ÿ\s\-\']+$/', $text)) {
            return false;
        }

        // Minimum length
        if (strlen($text) < 3) {
            return false;
        }

        // Contains at least one vowel
        if (! preg_match('/[aeiouyAEIOUYÀ-ÿ]/', $text)) {
            return false;
        }

        // Not all caps and too short
        $words = explode(' ', $text);
        if (count($words) === 1 && strlen($words[0]) < 3) {
            return false;
        }

        return true;
    }

    /**
     * Extract potential first name from a full name
     */
    public function extractFirstName(string $fullName): string
    {
        [, $firstName] = $this->splitFullName($fullName);

        return $firstName;
    }

    /**
     * Extract potential last name from a full name
     */
    public function extractLastName(string $fullName): string
    {
        [$lastName] = $this->splitFullName($fullName);

        return $lastName;
    }

    /**
     * Get all possible name variations from a name string
     */
    public function getNameVariations(string $name): array
    {
        $name = trim($name);
        if (empty($name)) {
            return [];
        }

        $variations = [$name];

        // Remove accents
        $withoutAccents = str_replace(
            ['À', 'Â', 'Æ', 'Ç', 'É', 'È', 'Ê', 'Ë', 'Î', 'Ï', 'Ô', 'Ù', 'Û', 'Ü'],
            ['A', 'A', 'AE', 'C', 'E', 'E', 'E', 'E', 'I', 'I', 'O', 'U', 'U', 'U'],
            $name
        );
        if ($withoutAccents !== $name) {
            $variations[] = $withoutAccents;
        }

        // All caps
        $allCaps = strtoupper($name);
        if ($allCaps !== $name) {
            $variations[] = $allCaps;
        }

        // Title case
        $titleCase = ucwords(strtolower($name));
        if ($titleCase !== $name) {
            $variations[] = $titleCase;
        }

        return array_unique($variations);
    }
}
