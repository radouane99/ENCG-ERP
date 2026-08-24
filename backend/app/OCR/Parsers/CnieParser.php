<?php

namespace App\OCR\Parsers;

use App\OCR\Contracts\DocumentParserInterface;
use App\OCR\Helpers\ArabicTextHelper;
use App\OCR\Helpers\FrenchNameHelper;
use App\OCR\OcrResult;

/**
 * Dynamic CNIE Parser — High-Performance & Fully Universal
 * Version Finale - Optimisée avec validation avancée
 */
class CnieParser implements DocumentParserInterface
{
    private const MRZ_PATTERNS = [
        '/^IDMAR[A-Z0-9<]{10,}/i',
        '/^[A-Z0-9<]{30,}/i',
        '/^[A-Z0-9<]{5,}\s+[A-Z0-9<]{5,}\s+[A-Z0-9<]{5,}/i',
        '/^[A-Z0-9<]{20,}<<[A-Z0-9<]{20,}/i',
    ];

    private const VERSO_MARKERS = [
        '/Adresse\s*[:\.]?/iu',
        '/Fils\s+de/iu',
        '/Fille\s+de/iu',
        '/العنوان/u',
        '/بن\s+/u',
        '/بنت\s+/u',
        '/دوار/u',
        '/زنقة/u',
        '/شارع/u',
        '/حي/u',
        '/رقم\s+الهاتف/u',
        '/Téléphone/u',
    ];

    private const RECT_MARKERS = [
        '/Carte\s+Nationale/i',
        '/Identité/i',
        '/CNIE/i',
        '/CIN/i',
        '/بطاقة\s+الوطنية/u',
    ];

    private array $emptyFields;

    public function __construct(
        private readonly ArabicTextHelper $arabic,
        private readonly FrenchNameHelper $french,
    ) {
        $this->emptyFields = $this->emptyResultArray();
    }

    public function supports(string $docType): bool
    {
        return in_array(strtolower(trim($docType)), ['cnie', 'cin', 'id_card', 'cni', 'id'], true);
    }

    public function parse(string $text): OcrResult
    {
        $result = new OcrResult($text);

        if (empty(trim($text))) {
            $result->fields = $this->emptyFields;

            return $result;
        }

        // Normalisation du texte
        $text = $this->normalizeText($text);
        $lines = $this->getLines($text);

        if (empty($lines)) {
            $result->fields = $this->emptyFields;

            return $result;
        }

        $fields = $this->emptyFields;

        // ── Stage 1: Split sections dynamique
        $sections = $this->splitSections($lines);

        // ── Stage 2: Extraction MRZ (priorité maximale)
        if (! empty($sections['mrz'])) {
            $this->parseMrzBlock($sections['mrz'], $fields);
        }

        // ── Stage 3: Extraction Recto
        $this->parseRectoBlock($sections['recto'], $fields);

        // ── Stage 4: Fallback CIN avancé
        if (empty($fields['cin'])) {
            $this->extractCinWithCorrection($text, $fields);
        }

        // ── Stage 5: Extraction Verso
        if (! empty($sections['verso'])) {
            $this->parseVersoBlock($sections['verso'], $fields);
        }

        // ── Stage 6: Fallbacks via Helpers
        $this->applyFallbacks($sections['recto']."\n".$sections['verso'], $fields);

        // ── Stage 7: Validation et normalisation (Hadi fin zedna la logique dyal ben/bent)
        $this->validateAndNormalizeFields($fields);

        // ── Stage 8: Mappage standard
        $this->mapOutputFields($fields);

        $result->fields = $fields;

        return $result;
    }

    /**
     * Normalisation du texte OCR
     */
    private function normalizeText(string $text): string
    {
        // Standardisation des sauts de ligne
        $text = preg_replace('/\r\n|\r/', "\n", $text);

        // Correction des erreurs OCR communes
        $text = str_replace(['ﬁ', 'ﬂ', 'œ', 'æ'], ['fi', 'fl', 'oe', 'ae'], $text);

        // Nettoyer les caractères inutiles
        $text = preg_replace('/[^\x{0600}-\x{06FF}A-Za-z0-9\s\.\,\-\/\:\n<]/u', ' ', $text);

        // Supprimer les espaces multiples
        $text = preg_replace('/\s+/', ' ', $text);

        return trim($text);
    }

    /**
     * Récupération des lignes
     */
    private function getLines(string $text): array
    {
        return array_values(array_filter(array_map('trim', explode("\n", $text))));
    }

    /**
     * Split des sections
     */
    private function splitSections(array $lines): array
    {
        $mrzLines = [];
        $rectoLines = [];
        $versoLines = [];
        $currentSection = 'recto';
        $hasVersoMarker = false;

        foreach ($lines as $line) {
            // Détection MRZ
            if ($this->isMRZLine($line)) {
                $mrzLines[] = $line;

                continue;
            }

            // Détection du début du verso
            if ($this->isVersoMarker($line)) {
                $hasVersoMarker = true;
                $currentSection = 'verso';
            }

            // Détection du retour au recto
            if ($hasVersoMarker && $this->isRectoMarker($line)) {
                $currentSection = 'recto';
                $hasVersoMarker = false;
            }

            if ($currentSection === 'verso') {
                $versoLines[] = $line;
            } else {
                $rectoLines[] = $line;
            }
        }

        // Si pas de verso détecté, essayer la détection basée sur la longueur
        if (empty($versoLines) && count($rectoLines) > 20) {
            $midpoint = (int) (count($rectoLines) / 2);
            $versoLines = array_slice($rectoLines, $midpoint);
            $rectoLines = array_slice($rectoLines, 0, $midpoint);
        }

        return [
            'mrz' => implode("\n", $mrzLines),
            'recto' => implode("\n", $rectoLines ?: $lines),
            'verso' => implode("\n", $versoLines),
        ];
    }

    /**
     * Détection MRZ
     */
    private function isMRZLine(string $line): bool
    {
        foreach (self::MRZ_PATTERNS as $pattern) {
            if (preg_match($pattern, $line)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Détection verso
     */
    private function isVersoMarker(string $line): bool
    {
        foreach (self::VERSO_MARKERS as $marker) {
            if (preg_match($marker, $line)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Détection recto
     */
    private function isRectoMarker(string $line): bool
    {
        foreach (self::RECT_MARKERS as $marker) {
            if (preg_match($marker, $line)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Parsing MRZ Block
     */
    private function parseMrzBlock(string $mrzText, array &$fields): void
    {
        $cleanMrz = str_replace(['(', ')', '{', '}', '[', ']', ' '], '', $mrzText);
        $lines = array_filter(explode("\n", $cleanMrz));

        foreach ($lines as $line) {
            $line = trim($line);

            // 1. Parsing du nom MRZ
            $this->parseMrzName($line, $fields);

            // 2. Parsing du CIN depuis MRZ
            $this->parseMrzCin($line, $fields);

            // 3. Parsing de la date de naissance
            $this->parseMrzBirthDate($line, $fields);

            // 4. Parsing du genre
            $this->parseMrzGender($line, $fields);

            // 5. Parsing de la date d'expiration
            $this->parseMrzExpiryDate($line, $fields);
        }
    }

    /**
     * Parsing du nom MRZ
     */
    private function parseMrzName(string $line, array &$fields): void
    {
        if (strpos($line, '<<') !== false && ! preg_match('/^(IDMARO|IDMAR|MAR|CAN|FRA|CARD)/i', $line)) {
            if (preg_match('/([A-Z]{2,30})<<([A-Z<\s]{2,60})/i', $line, $match)) {
                $last = trim(str_replace('<', '', $match[1]));
                $first = rtrim($match[2], '<');

                if (! in_array($last, ['IDMARO', 'IDMAR', 'MAR', 'CAN', 'FRA', 'CARD'], true)) {
                    $first = strtoupper(trim(str_replace('<', '-', $first), '-'));
                    $first = preg_replace('/\-+/', '-', $first);

                    if (empty($fields['last_name_fr']) && strlen($last) >= 2) {
                        $fields['last_name_fr'] = strtoupper($last);
                    }
                    if (empty($fields['first_name_fr']) && strlen($first) >= 2) {
                        $fields['first_name_fr'] = $first;
                    }
                }
            }
        }
    }

    /**
     * Parsing du CIN depuis MRZ
     */
    private function parseMrzCin(string $line, array &$fields): void
    {
        if (empty($fields['cin'])) {
            if (preg_match('/([A-Z]{1,2}\d{5,6})</i', $line, $match)) {
                $candidate = strtoupper($match[1]);
                $exclude = ['IDMARO', 'IDMAR', 'MAR', 'CAN', 'FRA', 'CARD', 'CNIE', 'CIN'];

                if (! in_array($candidate, $exclude) && $this->validateCIN($candidate)) {
                    $fields['cin'] = $candidate;
                }
            }
        }
    }

    /**
     * Parsing de la date de naissance depuis MRZ
     */
    private function parseMrzBirthDate(string $line, array &$fields): void
    {
        if (empty($fields['birth_date'])) {
            if (preg_match('/^(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{1}[FM]/i', $line, $match)) {
                $yy = (int) $match[1];
                $fullYear = $yy > 35 ? "19{$match[1]}" : "20{$match[1]}";
                $date = "{$fullYear}-{$match[2]}-{$match[3]}";

                if ($this->validateDate($date)) {
                    $fields['birth_date'] = $date;
                }
            }
        }
    }

    /**
     * Parsing du genre depuis MRZ
     */
    private function parseMrzGender(string $line, array &$fields): void
    {
        if (empty($fields['gender'])) {
            if (preg_match('/[FM]$/', $line, $match)) {
                $fields['gender'] = $match[0] === 'M' ? 'Male' : 'Female';
                $fields['sexe'] = $match[0];
            }
        }
    }

    /**
     * Parsing de la date d'expiration depuis MRZ
     */
    private function parseMrzExpiryDate(string $line, array &$fields): void
    {
        if (empty($fields['expiry_date'])) {
            if (preg_match('/^(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{1}[FM]/', $line, $match)) {
                $yy = (int) $match[1];
                $fullYear = $yy > 35 ? "19{$match[1]}" : "20{$match[1]}";
                $date = "{$fullYear}-{$match[2]}-{$match[3]}";

                if ($this->validateDate($date)) {
                    $fields['expiry_date'] = $date;
                }
            }
        }
    }

    /**
     * Parsing Recto Block
     */
    private function parseRectoBlock(string $rectoText, array &$fields): void
    {
        // ── Extraction du prénom français
        if (empty($fields['first_name_fr'])) {
            $patterns = [
                '/Prénom\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ\-\s]{2,30})/i',
                '/Prénom\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-z\s\-]+)/i',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $rectoText, $match)) {
                    $fields['first_name_fr'] = $this->normalizeFrenchName(trim($match[1]));
                    break;
                }
            }
        }

        // ── Extraction du nom français
        if (empty($fields['last_name_fr'])) {
            $patterns = [
                '/Nom\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ\-\s]{2,30})/i',
                '/Nom\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-z\s\-]+)/i',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $rectoText, $match)) {
                    $fields['last_name_fr'] = $this->normalizeFrenchName(trim($match[1]));
                    break;
                }
            }
        }

        // ── Extraction du prénom arabe
        if (empty($fields['first_name_ar'])) {
            $patterns = [
                '/(?:الاسم\s+الشخصي|الشخصي|الاسم)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]{2,30})/u',
                '/(?:الاسم)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]+)/u',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $rectoText, $match)) {
                    $fields['first_name_ar'] = $this->normalizeArabicName(trim($match[1]));
                    break;
                }
            }
        }

        // ── Extraction du nom arabe
        if (empty($fields['last_name_ar'])) {
            $patterns = [
                '/(?:النسب|اللقب|نسب)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]{2,30})/u',
                '/(?:اللقب)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]+)/u',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $rectoText, $match)) {
                    $fields['last_name_ar'] = $this->normalizeArabicName(trim($match[1]));
                    break;
                }
            }
        }

        // ── Extraction de la date de naissance
        if (empty($fields['birth_date'])) {
            $patterns = [
                '/(?:مزداد(?:ة)?\s+بتاريخ|Née?\s+le)\s*[:\.]?\s*(\d{2}[\.\/\-]\d{2}[\.\/\-]\d{4})/iu',
                '/Date\s+de\s+naissance\s*[:\.]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/iu',
                '/(\d{2})[\.\/\-](\d{2})[\.\/\-](\d{4})/',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $rectoText, $match)) {
                    if (isset($match[3])) {
                        $date = "{$match[3]}-{$match[2]}-{$match[1]}";
                    } elseif (isset($match[1])) {
                        $date = $this->parseDateString($match[1]);
                    }
                    if (isset($date) && $this->validateDate($date)) {
                        $fields['birth_date'] = $date;
                    }
                    break;
                }
            }
        }

        // ── Extraction de la ville de naissance (français)
        if (empty($fields['birth_city_fr'])) {
            $patterns = [
                '/(?:Lieu\s+de\s+naissance|Naissance|Ville)\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-z\s\-]{2,30})/iu',
                '/(?:à|À)\s*([A-Z][A-Za-z\s\-]{2,30})(?=\s+le|\s+le\s+\d|$)/u',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $rectoText, $match)) {
                    $city = trim($match[1]);
                    $exclude = ['la', 'le', 'les', 'carte', 'nationale', 'royaume', 'maroc'];
                    if (! in_array(strtolower($city), $exclude) && strlen($city) > 2) {
                        $fields['birth_city_fr'] = $this->normalizeFrenchName($city);
                        break;
                    }
                }
            }
        }

        // ── Extraction de la ville de naissance (arabe)
        if (empty($fields['birth_city_ar'])) {
            $patterns = [
                '/(?:مكان\s+الازدياد|مكان\s+الولادة|بـ|بـأ|بام)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]{2,30})/u',
                '/(?:مدينة)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]+)/u',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $rectoText, $match)) {
                    $fields['birth_city_ar'] = $this->normalizeArabicName(trim($match[1]));
                    break;
                }
            }
        }
    }

    /**
     * Extraction du CIN avec correction
     */
    private function extractCinWithCorrection(string $text, array &$fields): void
    {
        $patterns = [
            '/(?:CIN|CNIE|Carte\s+Nationale|بطاقة\s+الوطنية)\s*[:\.]?\s*([A-Z0-9]{6,8})/iu',
            '/\b([A-Z]{1,2}\d{5,6})\b/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $text, $matches)) {
                foreach ($matches[1] as $candidate) {
                    $candidate = strtoupper(trim($candidate));
                    $exclude = ['MAROC', 'ROYAUME', 'CAN', 'FRA', 'CARD', 'CNIE', 'CIN', 'IDMAR'];

                    if (in_array($candidate, $exclude)) {
                        continue;
                    }

                    // Correction des erreurs OCR
                    $candidate = str_replace(['O', 'o'], '0', $candidate);
                    $candidate = str_replace(['I', 'l', 'L'], '1', $candidate);
                    $candidate = str_replace('G', '6', $candidate);
                    $candidate = str_replace('S', '5', $candidate);
                    $candidate = str_replace('B', '8', $candidate);

                    if ($this->validateCIN($candidate)) {
                        $fields['cin'] = $candidate;

                        return;
                    }
                }
            }
        }
    }

    /**
     * Parsing Verso Block
     */
    private function parseVersoBlock(string $versoText, array &$fields): void
    {
        // ── Extraction du nom du père (arabe)
        if (empty($fields['father_name_ar'])) {
            $patterns = [
                '/(?:بنت|بن|ابن)\s+([\x{0600}-\x{06FF}\s]{2,30})(?:\s+بن|\s+و|$)/u',
                '/(?:والده?)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]+)/u',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $versoText, $match)) {
                    $fields['father_name_ar'] = $this->normalizeArabicName(trim($match[1]));
                    break;
                }
            }
        }

        // ── Extraction du nom de la mère (arabe)
        if (empty($fields['mother_name_ar'])) {
            $patterns = [
                '/و\s+([\x{0600}-\x{06FF}\s]{2,30})(?:\s+رقم|\s+العنوان|$)/u',
                '/(?:والده?)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]+)/u',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $versoText, $match)) {
                    $fields['mother_name_ar'] = $this->normalizeArabicName(trim($match[1]));
                    break;
                }
            }
        }

        // ── Extraction du nom du père (français)
        if (empty($fields['father_name_fr'])) {
            $patterns = [
                '/(?:Fille?|Fils)\s+de\s+([A-ZÉÈÊÀÙÎÔ\s\-]{2,40})/i',
                '/Père\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ\s\-]+)/i',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $versoText, $match)) {
                    $fields['father_name_fr'] = $this->normalizeFrenchName(trim($match[1]));
                    break;
                }
            }
        }

        // ── Extraction du nom de la mère (français)
        if (empty($fields['mother_name_fr'])) {
            $patterns = [
                '/et\s+de\s+([A-ZÉÈÊÀÙÎÔ\s\-]{2,40})/i',
                '/Mère\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ\s\-]+)/i',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $versoText, $match)) {
                    $fields['mother_name_fr'] = $this->normalizeFrenchName(trim($match[1]));
                    break;
                }
            }
        }

        // ── Extraction de l'adresse (arabe)
        if (empty($fields['address_ar'])) {
            $patterns = [
                '/(?:العنوان)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s0-9\-\,\.]+)/u',
                '/(?:الشارع|زنقة|دوار|حي)\s*([\x{0600}-\x{06FF}\s0-9]+)/u',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $versoText, $match)) {
                    $fields['address_ar'] = $this->normalizeArabicName(trim($match[1]));
                    break;
                }
            }
        }

        // ── Extraction de l'adresse (français)
        if (empty($fields['address_fr'])) {
            $patterns = [
                '/(?:Adresse)\s*[:\.]?\s*([A-Z0-9ÉÈÊÀÙÎÔ][A-Za-z0-9ÉÈÊÀÙÎÔéèêàùîô\s\-\,\.]{3,80})/i',
                '/(?:Rue|Avenue|Boulevard|Place)\s+([A-Za-z0-9\s\-]+)/i',
            ];
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $versoText, $match)) {
                    $address = trim($match[1]);
                    if (strlen($address) >= 5) {
                        $fields['address_fr'] = strtoupper($address);
                        break;
                    }
                }
            }
        }
    }

    /**
     * Apply Fallbacks via Helpers
     */
    private function applyFallbacks(string $fullText, array &$fields): void
    {
        // Fallback pour les noms arabes
        if (empty($fields['first_name_ar']) || empty($fields['last_name_ar'])) {
            $arNames = $this->arabic->extractName($fullText);
            if (empty($fields['last_name_ar'])) {
                $fields['last_name_ar'] = $arNames['last_name_ar'] ?? '';
            }
            if (empty($fields['first_name_ar'])) {
                $fields['first_name_ar'] = $arNames['first_name_ar'] ?? '';
            }
        }

        // Fallback pour les noms français
        if (empty($fields['first_name_fr']) || empty($fields['last_name_fr'])) {
            $frNames = $this->french->extractName($fullText);
            if (empty($fields['last_name_fr'])) {
                $fields['last_name_fr'] = $frNames['last_name_fr'] ?? '';
            }
            if (empty($fields['first_name_fr'])) {
                $fields['first_name_fr'] = $frNames['first_name_fr'] ?? '';
            }
        }
    }

    /**
     * Validation et normalisation des champs
     */
    private function validateAndNormalizeFields(array &$fields): void
    {
        // Normaliser les noms
        if (! empty($fields['last_name_fr'])) {
            $fields['last_name_fr'] = $this->normalizeFrenchName($fields['last_name_fr']);
        }
        if (! empty($fields['first_name_fr'])) {
            $fields['first_name_fr'] = $this->normalizeFrenchName($fields['first_name_fr']);
        }
        if (! empty($fields['father_name_fr'])) {
            $fields['father_name_fr'] = $this->normalizeFrenchName($fields['father_name_fr']);
        }
        if (! empty($fields['mother_name_fr'])) {
            $fields['mother_name_fr'] = $this->normalizeFrenchName($fields['mother_name_fr']);
        }

        if (! empty($fields['last_name_ar'])) {
            $fields['last_name_ar'] = $this->normalizeArabicName($fields['last_name_ar']);
        }
        if (! empty($fields['first_name_ar'])) {
            $fields['first_name_ar'] = $this->normalizeArabicName($fields['first_name_ar']);
        }
        if (! empty($fields['father_name_ar'])) {
            $fields['father_name_ar'] = $this->normalizeArabicName($fields['father_name_ar']);
        }
        if (! empty($fields['mother_name_ar'])) {
            $fields['mother_name_ar'] = $this->normalizeArabicName($fields['mother_name_ar']);
        }
        if (! empty($fields['address_ar'])) {
            $fields['address_ar'] = $this->normalizeArabicName($fields['address_ar']);
        }
        if (! empty($fields['birth_city_ar'])) {
            $fields['birth_city_ar'] = $this->normalizeArabicName($fields['birth_city_ar']);
        }

        // ── CLEAN PARENT NAMES (AJOUTÉ ICI) ──
        // Hada howa l'ajout li bghiti: kayqta3 l'ism mn "ben/bent" wla "بن/بنت"
        $fields['father_name_fr'] = $this->cleanParentName($fields['father_name_fr'] ?? null);
        $fields['mother_name_fr'] = $this->cleanParentName($fields['mother_name_fr'] ?? null);
        $fields['father_name_ar'] = $this->cleanParentName($fields['father_name_ar'] ?? null);
        $fields['mother_name_ar'] = $this->cleanParentName($fields['mother_name_ar'] ?? null);
        // ─────────────────────────────────────

        // Valider le CIN
        if (! empty($fields['cin']) && ! $this->validateCIN($fields['cin'])) {
            unset($fields['cin']);
        }

        // Nettoyer les champs vides
        foreach ($fields as $key => $value) {
            if (empty($value) || trim($value) === '') {
                unset($fields[$key]);
            }
        }
    }

    /**
     * Map des champs de sortie
     */
    private function mapOutputFields(array &$fields): void
    {
        // Standardisation
        if (! empty($fields['last_name_fr'])) {
            $fields['nom'] = $fields['last_name_fr'];
        }
        if (! empty($fields['first_name_fr'])) {
            $fields['prenom'] = $fields['first_name_fr'];
        }
        if (! empty($fields['cin'])) {
            $fields['numero_cin'] = $fields['cin'];
        }
        if (! empty($fields['gender'])) {
            $fields['sexe'] = $fields['gender'];
        }
    }

    /**
     * Parsing de date depuis une chaîne
     */
    private function parseDateString(string $dateStr): ?string
    {
        $parts = preg_split('/[\/\-\.]/', $dateStr);
        if (count($parts) === 3) {
            return "{$parts[2]}-{$parts[1]}-{$parts[0]}";
        }

        return null;
    }

    /**
     * Validation de la date
     */
    private function validateDate(string $date): bool
    {
        $parts = explode('-', $date);
        if (count($parts) !== 3) {
            return false;
        }

        [$year, $month, $day] = $parts;
        $year = (int) $year;
        $month = (int) $month;
        $day = (int) $day;

        if ($year < 1900 || $year > date('Y')) {
            return false;
        }

        if ($month < 1 || $month > 12) {
            return false;
        }

        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        if ($day < 1 || $day > $daysInMonth) {
            return false;
        }

        return true;
    }

    /**
     * Validation du CIN
     */
    private function validateCIN(string $cin): bool
    {
        return preg_match('/^[A-Z]{1,2}\d{5,6}$/', $cin) === 1;
    }

    /**
     * Normalisation du nom français
     */
    private function normalizeFrenchName(string $name): string
    {
        $name = str_replace(
            ['É', 'È', 'Ê', 'Ë', 'À', 'Â', 'Ù', 'Ô', 'Î', 'Ï', 'Ç'],
            ['E', 'E', 'E', 'E', 'A', 'A', 'U', 'O', 'I', 'I', 'C'],
            $name
        );

        $name = preg_replace('/\s+/', ' ', $name);
        $name = preg_replace('/[^A-Za-z\s\-]/', '', $name);

        return strtoupper(trim($name));
    }

    /**
     * Normalisation du nom arabe
     */
    private function normalizeArabicName(string $name): string
    {
        $name = preg_replace('/\s+/', ' ', $name);

        $replacements = [
            'آ' => 'ا',
            'أ' => 'ا',
            'إ' => 'ا',
            'ى' => 'ي',
            'ة' => 'ه',
            'ؤ' => 'و',
            'ئ' => 'ي',
        ];

        return str_replace(array_keys($replacements), array_values($replacements), trim($name));
    }

    // =========================================================
    // ██████  LOGIQUE AJOUTÉE POUR NETTOYER LES NOMS  ██████
    // =========================================================

    /**
     * Clean Parent Name: Supprime "ben", "bent", "بن", "بنت" et garde uniquement le premier mot.
     * Exemple: "JAWAD ben HMIDA" devient "JAWAD".
     */
    private function cleanParentName(?string $fullName): ?string
    {
        if (empty($fullName)) {
            return $fullName;
        }

        // L'expression régulière:
        // ^(.*?)              => Capture le premier mot (ou groupe de mots jusqu'au séparateur)
        // \s+                 => Suivi d'un ou plusieurs espaces
        // (?:ben|bent|بن|بنت) => Suivi de l'un de ces mots-clés (non capturant)
        // \s+.*$              => Suivi du reste de la phrase
        if (preg_match('/^(.*?)\s+(?:ben|bent|بن|بنت)\s+.*$/iu', $fullName, $matches)) {
            return trim($matches[1]); // Retourne uniquement "JAWAD" ou "AMINA"
        }

        // Si aucune correspondance, retourne le nom original
        return $fullName;
    }

    /**
     * Tableau de champs vides
     */
    private function emptyResultArray(): array
    {
        return [
            'first_name_fr' => '',
            'last_name_fr' => '',
            'first_name_ar' => '',
            'last_name_ar' => '',
            'cne' => '',
            'cin' => '',
            'birth_date' => '',
            'birth_city_fr' => '',
            'birth_city_ar' => '',
            'father_name_fr' => '',
            'father_name_ar' => '',
            'mother_name_fr' => '',
            'mother_name_ar' => '',
            'address_fr' => '',
            'address_ar' => '',
            'gender' => '',
            'sexe' => '',
            'expiry_date' => '',
            'bac_average' => '',
            'bac_mention' => '',
            'bac_type' => '',
            'high_school' => '',
            'academy' => '',
            'prefecture' => '',
            'nom' => '',
            'prenom' => '',
            'numero_cin' => '',
        ];
    }
}
