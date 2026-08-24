<?php

namespace App\OCR\Parsers;

use App\OCR\Contracts\DocumentParserInterface;
use App\OCR\Helpers\ArabicTextHelper;
use App\OCR\Helpers\BacFieldsHelper;
use App\OCR\Helpers\FrenchNameHelper;
use App\OCR\OcrResult;

/**
 * Dynamic Universal Parser for Moroccan Baccalauréat Grade Transcripts.
 * Version Finale - Optimisée avec validation et extraction avancée
 */
class ReleveParser implements DocumentParserInterface
{
    private FrenchNameHelper $frenchNameHelper;

    private ArabicTextHelper $arabicTextHelper;

    private BacFieldsHelper $bacFieldsHelper;

    // Liste des matières du bac marocain
    private const SUBJECTS = [
        'mathematiques' => ['/Math(?:é)?matiques?\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Mathématiques'],
        'physique_chimie' => ['/Physique\s+[eé]t\s+Chimie\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Physique-Chimie'],
        'sciences_vie_terre' => ['/Sciences\s+de\s+la\s+Vie\s+et\s+de\s+la\s+Terre\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'SVT'],
        'francais' => ['/Fran[cç]ais\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Français'],
        'arabe' => ['/Arabe\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Arabe'],
        'anglais' => ['/Anglais\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Anglais'],
        'philosophie' => ['/Philosophie\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Philosophie'],
        'education_islamique' => ['/Education\s+Islamique\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Éducation Islamique'],
        'histoire_geographie' => ['/Histoire\s+[eé]t?\s*G[eé]ographie\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Histoire-Géographie'],
        'allemand' => ['/Allemand\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Allemand'],
        'espagnol' => ['/Espagnol\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Espagnol'],
        'informatique' => ['/Informatique\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/i', 'Informatique'],
    ];

    public function __construct(
        ?FrenchNameHelper $frenchNameHelper = null,
        ?ArabicTextHelper $arabicTextHelper = null,
        ?BacFieldsHelper $bacFieldsHelper = null
    ) {
        $this->frenchNameHelper = $frenchNameHelper ?? new FrenchNameHelper;
        $this->arabicTextHelper = $arabicTextHelper ?? new ArabicTextHelper;
        $this->bacFieldsHelper = $bacFieldsHelper ?? new BacFieldsHelper;
    }

    public function supports(string $docType): bool
    {
        return in_array(strtolower(trim($docType)), ['releve', 'releve_notes', 'notes', 'transcript'], true);
    }

    public function parse(string $text): OcrResult
    {
        $result = new OcrResult($text);

        if (empty(trim($text))) {
            return $result;
        }

        $fields = [];

        // Normalisation du texte
        $text = $this->normalizeText($text);

        // ── Stage 1: Isolation des zones
        $headerZone = $this->extractHeaderZone($text);
        $gradesZone = $this->extractGradesZone($text);

        // ── Stage 2: Extraction des noms (priorité aux patterns structurés)
        $this->extractFrenchName($text, $headerZone, $fields);
        $this->extractArabicName($text, $headerZone, $fields);

        // ── Stage 3: Identifiants
        $this->extractCNE($text, $fields);
        $this->extractCIN($text, $fields);

        // ── Stage 4: Informations académiques
        $this->extractBacType($text, $fields);
        $this->extractMention($text, $fields);
        $this->extractHighSchool($text, $fields);
        $this->extractAcademy($text, $fields);
        $this->extractBacYear($text, $fields);
        $this->extractSession($text, $fields);

        // ── Stage 5: Notes détaillées par matière
        $this->extractDetailedGrades($gradesZone, $fields);

        // ── Stage 6: Notes sommaires
        $this->extractSummaryGrades($text, $fields);

        // ── Stage 7: Validation et normalisation
        $this->validateAndNormalizeFields($fields);

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
        $replacements = [
            '0' => 'O',  // Attention: parfois '0' est lu comme 'O'
            '1' => 'I',  // Parfois '1' est lu comme 'I'
            '5' => 'S',
            '6' => 'G',
            '8' => 'B',
        ];

        // Ne pas remplacer dans les nombres
        $text = preg_replace_callback('/\b\d+\b/', function ($match) {
            return $match[0];
        }, $text);

        return $text;
    }

    /**
     * Extraction de la zone du header
     */
    private function extractHeaderZone(string $text): string
    {
        $patterns = [
            '/Nom\s+et\s+Prénom(.*?)(?=EXAMEN|CONTROLE|LES\s+MATIERES|Note|$)/ius',
            '/(?:RELEVÉ|RELEVE)\s+DE\s+NOTES(.*?)(?=MATIERE|N°|$)/ius',
            '/(?:الصفحة|الرئيسية)(.*?)(?=المادة|الملاحظة|$)/u',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                return trim($match[1] ?? $text);
            }
        }

        return $text;
    }

    /**
     * Extraction de la zone des notes
     */
    private function extractGradesZone(string $text): string
    {
        $patterns = [
            '/(?:MATIERES?|مواد|المادة)(.*?)(?=MOYENNE|Moyenne|المعدل|$)/ius',
            '/(?:Notes|Notation)(.*?)(?=Résultat|$)/ius',
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
    private function extractFrenchName(string $text, string $headerZone, array &$fields): void
    {
        // Pattern 1: Format structuré "Nom et Prénom: XXXX"
        if (preg_match('/Nom\s+et\s+Prénom\s*[:\.]?\s*([A-Z\s\-]+?)(?=\s+Code|\s+CNIE|\n|$)/i', $text, $match)) {
            $this->parseFrenchFullName($match[1], $fields);

            return;
        }

        // Pattern 2: Format "NOM: XXXX Prénom: YYYY"
        if (preg_match('/(?:NOM|Nom)\s*[:\.]?\s*([A-Z\s\-]{2,30})\s*(?:PRENOM|Prénom)\s*[:\.]?\s*([A-Z\s\-]{2,30})/i', $text, $match)) {
            $fields['last_name_fr'] = $this->normalizeFrenchName(trim($match[1]));
            $fields['first_name_fr'] = $this->normalizeFrenchName(trim($match[2]));

            return;
        }

        // Pattern 3: Format "NOM PRENOM" (sans séparateur)
        if (preg_match('/([A-Z]{2,15})\s+([A-Z]{2,15})/i', $headerZone, $match)) {
            if (strlen($match[1]) > 2 && strlen($match[2]) > 2) {
                $fields['last_name_fr'] = $this->normalizeFrenchName($match[1]);
                $fields['first_name_fr'] = $this->normalizeFrenchName($match[2]);

                return;
            }
        }

        // Fallback via helper
        $frenchNames = $this->frenchNameHelper->extractName($headerZone);
        if (! empty($frenchNames['last_name_fr'])) {
            $fields['last_name_fr'] = $this->normalizeFrenchName($frenchNames['last_name_fr']);
        }
        if (! empty($frenchNames['first_name_fr'])) {
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
            $firstName = implode(' ', $parts);

            // Vérifier si le nom de famille est valide
            if (strlen($lastName) >= 2 && ! preg_match('/^(Code|CNIE|CIN)/i', $lastName)) {
                $fields['last_name_fr'] = $this->normalizeFrenchName($lastName);
                $fields['first_name_fr'] = $this->normalizeFrenchName($firstName);
            }
        }
    }

    /**
     * Extraction du nom arabe
     */
    private function extractArabicName(string $text, string $headerZone, array &$fields): void
    {
        // Nettoyer le header pour l'arabe
        $cleanHeader = $this->cleanArabicHeader($headerZone);

        // Pattern 1: Format structuré arabe
        if (preg_match('/(?:الاسم\s+واللقب|الاسم\s+والنسب)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]+)/u', $text, $match)) {
            $this->parseArabicFullName($match[1], $fields);

            return;
        }

        // Pattern 2: Format "اللقب: XXXX الاسم: YYYY"
        if (preg_match('/(?:اللقب|النسب)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]{2,30})\s*(?:الاسم\s+الشخصي|الاسم)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]{2,30})/u', $text, $match)) {
            $fields['last_name_ar'] = $this->normalizeArabicName(trim($match[1]));
            $fields['first_name_ar'] = $this->normalizeArabicName(trim($match[2]));

            return;
        }

        // Fallback via helper
        $arabicNames = $this->arabicTextHelper->extractName($cleanHeader);
        if (! empty($arabicNames['last_name_ar'])) {
            $fields['last_name_ar'] = $this->normalizeArabicName($arabicNames['last_name_ar']);
        }
        if (! empty($arabicNames['first_name_ar'])) {
            $fields['first_name_ar'] = $this->normalizeArabicName($arabicNames['first_name_ar']);
        }
    }

    /**
     * Nettoyage du header pour l'arabe
     */
    private function cleanArabicHeader(string $header): string
    {
        $exclude = [
            '/الأكاديمية/',
            '/الجهوية/',
            '/التربية/',
            '/التكوين/',
            '/وزارة/',
            '/المملكة/',
            '/الرياضة/',
            '/المديرية/',
            '/الإقليمية/',
        ];

        foreach ($exclude as $pattern) {
            $header = preg_replace($pattern, '', $header);
        }

        return $header;
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
            '/(?:CNE|MASSAR|CODE|Code\s+Candidat)\s*[:\-]?\s*([A-Z]?\d{8,10})/iu',
            '/\b([A-Z]\d{9})\b/i',
            '/\b([A-Z]\d{8})\b/i', // Format alternatif
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
            '/(?:CIN|CNIE|CARTE|Carte)\s*[:\-]?\s*([A-Z0-9]{6,8})/iu',
            '/\b([A-Z]{1,2}\d{5,6})\b/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $text, $matches)) {
                foreach ($matches[1] as $candidate) {
                    $cin = strtoupper(trim($candidate));
                    $exclude = ['MAROC', 'ROYAUME', 'CAN', 'FRA', 'CARD', 'CNIE', 'CIN'];

                    if (! in_array($cin, $exclude) && $this->validateCIN($cin)) {
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
     * Extraction du type de bac
     */
    private function extractBacType(string $text, array &$fields): void
    {
        $bacType = $this->bacFieldsHelper->extractBacType($text);
        if (! empty($bacType)) {
            $fields['bac_type'] = $bacType;

            return;
        }

        $patterns = [
            '/(?:Série|Filière|Bac(?:calauréat)?)\s*[:\.]?\s*([A-Z0-9\s\-]+)/iu',
            '/(?:Sciences\s+Mathématiques|SM|SVT|PC|SE|Sciences\s+Economiques)/i',
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
        $validMentions = [
            'TRES BIEN',
            'TRÈS BIEN',
            'BIEN',
            'ASSEZ BIEN',
            'PASSABLE',
            'MOYEN',
            'EXCELLENT',
        ];

        $mentionsPattern = implode('|', array_map(function ($m) {
            return preg_quote($m, '/');
        }, $validMentions));

        $patterns = [
            "/Mention\s*[:\.]?\s*($mentionsPattern)/iu",
            "/Mention\s*(?:Générale)?\s*[:\.]?\s*([A-Z\s]+?)(?:\d|$)/iu",
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $mention = strtoupper(trim($match[1]));
                $mention = str_replace('TRÈS', 'TRES', $mention);

                if (in_array($mention, $validMentions)) {
                    $fields['mention'] = $mention;

                    return;
                }
            }
        }

        // Fallback via helper
        $mention = $this->bacFieldsHelper->extractBacMention($text);
        if (! empty($mention)) {
            $fields['mention'] = strtoupper($mention);
        }
    }

    /**
     * Extraction du lycée
     */
    private function extractHighSchool(string $text, array &$fields): void
    {
        $highSchool = $this->bacFieldsHelper->extractHighSchool($text);
        if (! empty($highSchool)) {
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
            '/(?:Année|Année\s+Scolaire|سنة|الدورة)\s*[:\-]?\s*(20\d{2})/iu',
            '/\b(20\d{2})\b/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $text, $matches)) {
                foreach ($matches[1] as $year) {
                    $year = (int) $year;
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
            '/(?:Sessions?)\s*[:\.]?\s*(Normale|Rattrapage)/iu',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $session = strtoupper(trim($match[1]));
                if (in_array($session, ['NORMALE', 'RATTRAPAGE', 'ORDINAIRE'])) {
                    $fields['session'] = $session;

                    return;
                }
            }
        }
    }

    /**
     * Extraction des notes détaillées
     */
    private function extractDetailedGrades(string $text, array &$fields): void
    {
        if (empty($text)) {
            return;
        }

        foreach (self::SUBJECTS as $key => [$pattern, $label]) {
            if (preg_match($pattern, $text, $match)) {
                $grade = (float) str_replace(',', '.', $match[1]);
                if ($grade >= 0 && $grade <= 20) {
                    $fields["grade_{$key}"] = $grade;
                    $fields["subject_{$key}"] = $label;
                }
            }
        }
    }

    /**
     * Extraction des notes sommaires
     */
    private function extractSummaryGrades(string $text, array &$fields): void
    {
        $patterns = [
            'note_regional' => [
                '/REGIONAL\s+(\d{1,2}[\.,]\d{2})/i',
                '/(?:Examen\s+R[eé]gional|R[eé]gional|الجهوي)\s*[:\.]?\s*(\d{1,2}[\.,]\d{2})/iu',
            ],
            'note_national' => [
                '/NATIONAL\s+(\d{1,2}[\.,]\d{2})/i',
                '/(?:Examen\s+National|National|الوطني)\s*[:\.]?\s*(\d{1,2}[\.,]\d{2})/iu',
            ],
            'moyenne_bac' => [
                '/(?:MOY\.\s*GENERALE|Moyenne\s+G[eé]n[eé]rale|المعدل\s+العام)\s*[:\.]?\s*(\d{1,2}[\.,]\d{2})/iu',
                '/Moyenne\s*[:\.]?\s*(\d{1,2}[\.,]\d{2})/i',
            ],
            'note_controle' => [
                '/(?:Controle|Contrôle)\s*[:\.]?\s*(\d{1,2}[\.,]\d{2})/i',
            ],
        ];

        foreach ($patterns as $field => $patternsList) {
            foreach ($patternsList as $pattern) {
                if (preg_match($pattern, $text, $match)) {
                    $value = (float) str_replace(',', '.', $match[1]);
                    if ($value >= 0 && $value <= 20) {
                        $fields[$field] = $value;
                        break 2;
                    }
                }
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
        if (! empty($fields['last_name_ar'])) {
            $fields['last_name_ar'] = $this->normalizeArabicName($fields['last_name_ar']);
        }
        if (! empty($fields['first_name_ar'])) {
            $fields['first_name_ar'] = $this->normalizeArabicName($fields['first_name_ar']);
        }

        // Valider les notes
        foreach ($fields as $key => $value) {
            if (strpos($key, 'grade_') === 0 || in_array($key, ['note_regional', 'note_national', 'moyenne_bac'])) {
                if (is_numeric($value) && ($value < 0 || $value > 20)) {
                    unset($fields[$key]);
                }
            }
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
