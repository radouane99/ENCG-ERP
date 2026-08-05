<?php

namespace App\OCR\Parsers;

use App\OCR\Contracts\DocumentParserInterface;
use App\OCR\OcrResult;
use App\OCR\Helpers\FrenchNameHelper;
use App\OCR\Helpers\ArabicTextHelper;
use App\OCR\Helpers\BacFieldsHelper;

/**
 * Universal Dynamic Parser for Moroccan Baccalauréat Diplomas & Attestations.
 * Version Finale - Optimisée avec validation et extraction avancée
 */
class BacParser implements DocumentParserInterface
{
    private FrenchNameHelper $frenchNameHelper;
    private ArabicTextHelper $arabicTextHelper;
    private BacFieldsHelper $bacFieldsHelper;

    // Mentions valides
    private const VALID_MENTIONS = [
        'TRES BIEN',
        'TRÈS BIEN',
        'BIEN',
        'ASSEZ BIEN',
        'PASSABLE',
        'MOYEN',
        'EXCELLENT'
    ];

    public function __construct(
        ?FrenchNameHelper $frenchNameHelper = null,
        ?ArabicTextHelper $arabicTextHelper = null,
        ?BacFieldsHelper $bacFieldsHelper = null
    ) {
        $this->frenchNameHelper = $frenchNameHelper ?? new FrenchNameHelper();
        $this->arabicTextHelper = $arabicTextHelper ?? new ArabicTextHelper();
        $this->bacFieldsHelper  = $bacFieldsHelper ?? new BacFieldsHelper();
    }

    public function supports(string $docType): bool
    {
        return in_array(strtolower(trim($docType)), ['bac', 'baccalaureat', 'attestation_bac', 'diplome_bac'], true);
    }

    public function parse(string $text): OcrResult
    {
        $result = new OcrResult($text);

        if (empty(trim($text))) {
            return $result;
        }

        // Normalisation du texte
        $text = $this->normalizeText($text);

        $fields = [];

        // ── Stage 1: Isolation des zones
        $candidateZone = $this->extractCandidateZone($text);
        $certificateZone = $this->extractCertificateZone($text);
        $footerZone = $this->extractFooterZone($text);

        // ── Stage 2: Identité
        $this->extractFrenchName($text, $candidateZone, $fields);
        $this->extractArabicName($text, $candidateZone, $fields);
        $this->extractCNE($text, $fields);
        $this->extractCIN($text, $fields);
        $this->extractBirthDate($text, $fields);
        $this->extractBirthPlace($text, $fields);
        $this->extractNationality($text, $fields);

        // ── Stage 3: Informations académiques
        $this->extractBacType($text, $fields);
        $this->extractMention($text, $fields);
        $this->extractHighSchool($text, $fields);
        $this->extractAcademy($text, $fields);
        $this->extractBacYear($text, $fields);
        $this->extractSession($text, $fields);
        $this->extractBacAverage($text, $fields);

        // ── Stage 4: Métadonnées du document
        $this->extractSerialNumber($text, $fields);
        $this->extractIssueDate($text, $fields);
        $this->extractDeliberationDate($text, $fields);
        $this->extractDocumentType($text, $fields);

        // ── Stage 5: Validation et normalisation
        $this->validateAndNormalizeFields($fields);

        $result->fields = $fields;
        return $result;
    }

    /**
     * Normalisation du texte OCR
     */
    private function normalizeText(string $text): string
    {
        $text = preg_replace('/\r\n|\r/', "\n", $text);
        $text = preg_replace('/[^\x{0600}-\x{06FF}A-Za-z0-9\s\.\,\-\/\(\)\:\n]/u', ' ', $text);
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    /**
     * Extraction de la zone du candidat
     */
    private function extractCandidateZone(string $text): string
    {
        $patterns = [
            '/(?:candidat|المترشح)(.*?)(?:Etablissement|المؤسسة|Niveau|مكيرة|Pour|$)/ius',
            '/(?:Nom|الاسم)(.*?)(?:Niveau|Filière|Série|$)/iu',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                return trim($match[1] ?? $text);
            }
        }

        return $text;
    }

    /**
     * Extraction de la zone du certificat
     */
    private function extractCertificateZone(string $text): string
    {
        $patterns = [
            '/(?:Baccalauréat|Diplôme|شهادة)(.*?)(?:Fait|Signatures|$)/ius',
            '/(?:Certificat|Attestation)(.*?)(?:Délivré|$)/iu',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                return trim($match[1] ?? '');
            }
        }

        return '';
    }

    /**
     * Extraction de la zone du footer
     */
    private function extractFooterZone(string $text): string
    {
        $patterns = [
            '/(?:Fait|Délivré|Signatures|Signé)(.*?)$/iu',
            '/(?:تم|حرر|وقع)(.*?)$/u',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                return trim($match[1] ?? '');
            }
        }

        return '';
    }

    /**
     * Extraction du nom français
     */
    private function extractFrenchName(string $text, string $candidateZone, array &$fields): void
    {
        // Pattern 1: Format "candidat(e): XXXX"
        if (preg_match('/candidat\(e\)\s*[:\.]?\s*([A-Z\s\-]+)/iu', $candidateZone, $match)) {
            $this->parseFrenchFullName($match[1], $fields);
            return;
        }

        // Pattern 2: Format "Nom: XXXX Prénom: YYYY"
        if (preg_match('/(?:NOM|Nom)\s*[:\.]?\s*([A-Z\s\-]{2,30})\s*(?:PRENOM|Prénom)\s*[:\.]?\s*([A-Z\s\-]{2,30})/iu', $text, $match)) {
            $fields['last_name_fr'] = $this->normalizeFrenchName(trim($match[1]));
            $fields['first_name_fr'] = $this->normalizeFrenchName(trim($match[2]));
            return;
        }

        // Pattern 3: Format standard "NOM PRENOM"
        if (preg_match('/([A-Z]{2,15})\s+([A-Z]{2,15})/i', $candidateZone, $match)) {
            if (strlen($match[1]) > 2 && strlen($match[2]) > 2) {
                $fields['last_name_fr'] = $this->normalizeFrenchName($match[1]);
                $fields['first_name_fr'] = $this->normalizeFrenchName($match[2]);
                return;
            }
        }

        // Fallback via helper
        $frenchNames = $this->frenchNameHelper->extractName($candidateZone);
        if (!empty($frenchNames['last_name_fr'])) {
            $fields['last_name_fr'] = $this->normalizeFrenchName($frenchNames['last_name_fr']);
        }
        if (!empty($frenchNames['first_name_fr'])) {
            $fields['first_name_fr'] = $this->normalizeFrenchName($frenchNames['first_name_fr']);
        }
    }

    /**
     * Parsing du nom français complet
     */
    private function parseFrenchFullName(string $fullName, array &$fields): void
    {
        $fullName = trim(preg_replace('/\s+/', ' ', $fullName));
        $parts = array_values(array_filter(explode(' ', $fullName)));
        
        if (count($parts) >= 2) {
            $lastName = array_shift($parts);
            if (strlen($lastName) >= 2) {
                $fields['last_name_fr'] = $this->normalizeFrenchName($lastName);
                $fields['first_name_fr'] = $this->normalizeFrenchName(implode(' ', $parts));
            }
        }
    }

    /**
     * Extraction du nom arabe
     */
    private function extractArabicName(string $text, string $candidateZone, array &$fields): void
    {
        // Pattern 1: Format structuré "المترشح(ة): XXXX"
        if (preg_match('/المترشح\(ة\)\s*[:\-]?\s*([\x{0600}-\x{06FF}\s]+)/u', $text, $match)) {
            $this->parseArabicFullName($match[1], $fields);
            return;
        }

        // Pattern 2: Format "اللقب: XXXX الاسم: YYYY"
        if (preg_match('/(?:اللقب|النسب)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]{2,30})\s*(?:الاسم\s+الشخصي|الاسم)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]{2,30})/u', $text, $match)) {
            $fields['last_name_ar'] = $this->normalizeArabicName(trim($match[1]));
            $fields['first_name_ar'] = $this->normalizeArabicName(trim($match[2]));
            return;
        }

        // Pattern 3: Format "NOM PRENOM" en arabe
        if (preg_match('/([\x{0600}-\x{06FF}]{2,10})\s+([\x{0600}-\x{06FF}]{2,10})/u', $candidateZone, $match)) {
            $fields['last_name_ar'] = $this->normalizeArabicName($match[1]);
            $fields['first_name_ar'] = $this->normalizeArabicName($match[2]);
            return;
        }

        // Fallback via helper
        $arabicNames = $this->arabicTextHelper->extractName($candidateZone);
        if (!empty($arabicNames['last_name_ar'])) {
            $fields['last_name_ar'] = $this->normalizeArabicName($arabicNames['last_name_ar']);
        }
        if (!empty($arabicNames['first_name_ar'])) {
            $fields['first_name_ar'] = $this->normalizeArabicName($arabicNames['first_name_ar']);
        }
    }

    /**
     * Parsing du nom arabe complet
     */
    private function parseArabicFullName(string $fullName, array &$fields): void
    {
        $fullName = trim(preg_replace('/\s+/', ' ', $fullName));
        $parts = array_values(array_filter(explode(' ', $fullName)));
        
        if (count($parts) >= 2) {
            $fields['last_name_ar'] = $this->normalizeArabicName($parts[0]);
            $fields['first_name_ar'] = $this->normalizeArabicName(implode(' ', array_slice($parts, 1)));
        }
    }

    /**
     * Extraction du CNE
     */
    private function extractCNE(string $text, array &$fields): void
    {
        $patterns = [
            '/(?:CNE|MASSAR|CODE)\s*[:\-]?\s*([A-Z]?\d{8,10})/iu',
            '/\b([A-Z]\d{9})\b/i',
            '/\b([A-Z]\d{8})\b/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $cne = strtoupper(trim($match[1]));
                if ($this->validateCNE($cne)) {
                    $fields['cne'] = $cne;
                    return;
                }
            }
        }
    }

    /**
     * Validation du CNE
     */
    private function validateCNE(string $cne): bool
    {
        return preg_match('/^[A-Z]\d{8,9}$/', $cne) === 1;
    }

    /**
     * Extraction du CIN
     */
    private function extractCIN(string $text, array &$fields): void
    {
        $patterns = [
            '/(?:CIN|CNIE|Carte)\s*[:\-]?\s*([A-Z0-9]{6,8})/iu',
            '/\b([A-Z]{1,2}\d{5,6})\b/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $text, $matches)) {
                foreach ($matches[1] as $candidate) {
                    $cin = strtoupper(trim($candidate));
                    $exclude = ['MAROC', 'ROYAUME', 'CAN', 'FRA', 'CARD', 'CNIE', 'CIN'];
                    
                    if (!in_array($cin, $exclude) && $this->validateCIN($cin)) {
                        $fields['cin'] = $cin;
                        return;
                    }
                }
            }
        }
    }

    /**
     * Validation du CIN
     */
    private function validateCIN(string $cin): bool
    {
        return preg_match('/^[A-Z]{1,2}\d{5,6}$/', $cin) === 1;
    }

    /**
     * Extraction de la date de naissance
     */
    private function extractBirthDate(string $text, array &$fields): void
    {
        $patterns = [
            '/(?:Né|Née|Naissance)\s+le\s*[:\.]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/iu',
            '/Date\s+de\s+naissance\s*[:\.]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/iu',
            '/Naissance\s*[:\.]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/iu',
            '/([0-3][0-9])\s*[\/\-\.]\s*([0-1][0-9])\s*[\/\-\.]\s*(\d{4})/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $date = $this->parseDate($match);
                if ($date && $this->validateDate($date)) {
                    $fields['birth_date'] = $date;
                    return;
                }
            }
        }
    }

    /**
     * Parsing de la date
     */
    private function parseDate(array $match): ?string
    {
        if (isset($match[3])) {
            // Format JJ-MM-AAAA
            return "{$match[3]}-{$match[2]}-{$match[1]}";
        }

        if (isset($match[1])) {
            $parts = preg_split('/[\/\-\.]/', $match[1]);
            if (count($parts) === 3) {
                return "{$parts[2]}-{$parts[1]}-{$parts[0]}";
            }
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

        list($year, $month, $day) = $parts;
        $year = (int)$year;
        $month = (int)$month;
        $day = (int)$day;

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
     * Extraction du lieu de naissance
     */
    private function extractBirthPlace(string $text, array &$fields): void
    {
        $patterns = [
            '/(?:Lieu\s+de\s+naissance|Naissance)\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-z\s\-]{2,30})/iu',
            '/(?:à|À)\s*([A-Z][A-Za-z\s\-]{2,30})(?=\s+le|\s+le\s+\d|$)/u',
            '/(?:مكان\s+الولادة|مكان\s+الازدياد)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]{2,30})/u',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $place = trim($match[1]);
                if (strlen($place) > 2) {
                    $fields['birth_place_fr'] = $this->normalizeFrenchName($place);
                    return;
                }
            }
        }
    }

    /**
     * Extraction de la nationalité
     */
    private function extractNationality(string $text, array &$fields): void
    {
        $patterns = [
            '/(?:Nationalité|الجنسية)\s*[:\.]?\s*([A-Za-z\x{0600}-\x{06FF}\s]+)/iu',
            '/\b(Marocain|Marocaine|Moroccan|المغربية)\b/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $nationality = trim($match[1]);
                if (strlen($nationality) > 2) {
                    $fields['nationality'] = $nationality;
                    return;
                }
            }
        }
    }

    /**
     * Extraction du type de bac
     */
    private function extractBacType(string $text, array &$fields): void
    {
        $bacType = $this->bacFieldsHelper->extractBacType($text);
        if (!empty($bacType)) {
            $fields['bac_type'] = $bacType;
            return;
        }

        $patterns = [
            '/(?:Série|Filière|Bac(?:calauréat)?)\s*[:\.]?\s*([A-Z0-9\s\-]+)/iu',
            '/(?:Sciences\s+Mathématiques|SM|SVT|PC|SE|Sciences\s+Economiques|Lettres)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $type = strtoupper(trim($match[1] ?? $match[0]));
                $fields['bac_type'] = $type;
                return;
            }
        }
    }

    /**
     * Extraction de la mention
     */
    private function extractMention(string $text, array &$fields): void
    {
        $mentionsPattern = implode('|', array_map(function($m) {
            return preg_quote($m, '/');
        }, self::VALID_MENTIONS));

        $patterns = [
            "/Mention\s*[:\.]?\s*($mentionsPattern)/iu",
            "/Mention\s*(?:Générale)?\s*[:\.]?\s*([A-Z\s]+?)(?:\d|$)/iu",
            "/\b($mentionsPattern)\b/i",
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $mention = strtoupper(trim($match[1]));
                $mention = str_replace('TRÈS', 'TRES', $mention);
                
                if (in_array($mention, self::VALID_MENTIONS)) {
                    $fields['mention'] = $mention;
                    return;
                }
            }
        }

        // Fallback via helper
        $mention = $this->bacFieldsHelper->extractBacMention($text);
        if (!empty($mention)) {
            $fields['mention'] = strtoupper($mention);
        }
    }

    /**
     * Extraction du lycée
     */
    private function extractHighSchool(string $text, array &$fields): void
    {
        $highSchool = $this->bacFieldsHelper->extractHighSchool($text);
        if (!empty($highSchool)) {
            $fields['high_school'] = $highSchool;
            return;
        }

        $patterns = [
            '/(?:LYCÉE|ETABLISSEMENT|ÉTABLISSEMENT|المؤسسة|الثانوية)\s*[:\.]?\s*([^\n\r,]+)/iu',
            '/(?:Etablissement|Établissement)\s*[:\.]?\s*([A-Z\s\-]+)/iu',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $school = trim($match[1]);
                if (strlen($school) > 3) {
                    $fields['high_school'] = $school;
                    return;
                }
            }
        }
    }

    /**
     * Extraction de l'académie
     */
    private function extractAcademy(string $text, array &$fields): void
    {
        $patterns = [
            '/(?:AREF|Académie|Academie)\s*([A-Z\s\-]+)/i',
            '/(?:Académie Régionale de l\'Éducation et de la Formation)\s*[:\.]?\s*([^\n\r,]+)/iu',
            '/(?:الأكاديمية|الجهوية)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]+)/u',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $academy = trim($match[1]);
                if (strlen($academy) > 3) {
                    $fields['academy'] = $academy;
                    return;
                }
            }
        }
    }

    /**
     * Extraction de l'année du bac
     */
    private function extractBacYear(string $text, array &$fields): void
    {
        $patterns = [
            '/(?:Session|Année|سنة|دورة)\s*[:\-]?\s*(20\d{2})/iu',
            '/Baccalauréat\s*(?:session\s*)?(20\d{2})/iu',
            '/\b(20\d{2})\b/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $text, $matches)) {
                foreach ($matches[1] as $year) {
                    $year = (int)$year;
                    if ($year >= 2000 && $year <= date('Y') + 2) {
                        $fields['bac_year'] = $year;
                        return;
                    }
                }
            }
        }
    }

    /**
     * Extraction de la session
     */
    private function extractSession(string $text, array &$fields): void
    {
        $patterns = [
            '/(?:Session|دورة)\s*[:\.]?\s*([A-Z]+)/iu',
            '/(?:Sessions?)\s*[:\.]?\s*(Normale|Rattrapage|Ordinaire)/iu',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $session = strtoupper(trim($match[1]));
                if (in_array($session, ['NORMALE', 'RATTRAPAGE', 'ORDINAIRE', 'JANVIER', 'JUIN', 'JUILLET'])) {
                    $fields['session'] = $session;
                    return;
                }
            }
        }
    }

    /**
     * Extraction de la moyenne du bac
     */
    private function extractBacAverage(string $text, array &$fields): void
    {
        $patterns = [
            '/(?:Moyenne|Note)\s*(?:Générale|العام)?\s*[:=]?\s*(\d{1,2}[\.,]\d{1,2})/iu',
            '/MOYENNE\s*[:\.]?\s*(\d{1,2}[\.,]\d{2})/i',
            '/المعدل\s*[:\.]?\s*(\d{1,2}[\.,]\d{2})/u',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $average = (float) str_replace(',', '.', $match[1]);
                if ($average >= 0 && $average <= 20) {
                    $fields['moyenne_bac'] = $average;
                    return;
                }
            }
        }
    }

    /**
     * Extraction du numéro de série
     */
    private function extractSerialNumber(string $text, array &$fields): void
    {
        $patterns = [
            '/N°\s*de\s*série\s*\/?[^\n\r]*?\s*(\d+\/\s*20\d{2})/iu',
            '/(?:Numéro|N°)\s*[:\.]?\s*([A-Z0-9\/\-]+)/iu',
            '/Serial\s*Number\s*[:\.]?\s*([A-Z0-9\/\-]+)/iu',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $serial = trim($match[1]);
                if (strlen($serial) > 3) {
                    $fields['serial_number'] = str_replace(' ', '', $serial);
                    return;
                }
            }
        }
    }

    /**
     * Extraction de la date d'émission
     */
    private function extractIssueDate(string $text, array &$fields): void
    {
        $patterns = [
            '/Fait\s+le\s*[:\.]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/iu',
            '/Délivré\s+le\s*[:\.]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/iu',
            '/التحرير\s+بتاريخ\s*[:\.]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/u',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $date = $this->parseDate($match);
                if ($date && $this->validateDate($date)) {
                    $fields['issue_date'] = $date;
                    return;
                }
            }
        }
    }

    /**
     * Extraction de la date de délibération
     */
    private function extractDeliberationDate(string $text, array &$fields): void
    {
        $patterns = [
            '/Délibération\s+du\s*[:\.]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/iu',
            '/tenues\s+le\s*[:\.]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/iu',
            '/المداولة\s+بتاريخ\s*[:\.]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/u',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $date = $this->parseDate($match);
                if ($date && $this->validateDate($date)) {
                    $fields['deliberation_date'] = $date;
                    return;
                }
            }
        }
    }

    /**
     * Extraction du type de document
     */
    private function extractDocumentType(string $text, array &$fields): void
    {
        $types = [
            'DIPLOME' => '/Diplôme\s+du\s+Baccalauréat/i',
            'ATTESTATION' => '/Attestation\s+de\s+réussite/i',
            'RELEVE' => '/Relevé\s+de\s+notes/i',
            'CERTIFICAT' => '/Certificat\s+de\s+scolarité/i',
        ];

        foreach ($types as $type => $pattern) {
            if (preg_match($pattern, $text)) {
                $fields['document_type'] = $type;
                return;
            }
        }

        // Par défaut
        if (preg_match('/Baccalauréat/i', $text)) {
            $fields['document_type'] = 'DIPLOME';
        }
    }

    /**
     * Validation et normalisation des champs
     */
    private function validateAndNormalizeFields(array &$fields): void
    {
        // Normaliser les noms français
        if (!empty($fields['last_name_fr'])) {
            $fields['last_name_fr'] = $this->normalizeFrenchName($fields['last_name_fr']);
        }
        if (!empty($fields['first_name_fr'])) {
            $fields['first_name_fr'] = $this->normalizeFrenchName($fields['first_name_fr']);
        }

        // Normaliser les noms arabes
        if (!empty($fields['last_name_ar'])) {
            $fields['last_name_ar'] = $this->normalizeArabicName($fields['last_name_ar']);
        }
        if (!empty($fields['first_name_ar'])) {
            $fields['first_name_ar'] = $this->normalizeArabicName($fields['first_name_ar']);
        }

        // Valider la moyenne
        if (!empty($fields['moyenne_bac']) && ($fields['moyenne_bac'] < 0 || $fields['moyenne_bac'] > 20)) {
            unset($fields['moyenne_bac']);
        }

        // Nettoyer les champs vides
        foreach ($fields as $key => $value) {
            if (empty($value) || trim($value) === '') {
                unset($fields[$key]);
            }
        }
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
}