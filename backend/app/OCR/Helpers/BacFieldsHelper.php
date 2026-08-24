<?php

namespace App\OCR\Helpers;

/**
 * BAC Fields Helper
 *
 * Extracts academic metadata shared between BAC and Relevé parsers:
 *  - Bac Type (filière / série / option)
 *  - Bac Mention
 *  - Lycée / High School name
 *  - Bac Year
 *  - Session type
 *  - Average score validation
 *
 * @version 2.0 Final
 */
class BacFieldsHelper
{
    /**
     * Normalized Filière Mappings.
     * Ordered from most specific to general to avoid premature matches.
     */
    private array $bacTypePatterns = [
        // Sciences Économiques & Gestion
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+Économiques?\s+et\s+de\s+Gestion/iu' => 'Sciences Économiques et de Gestion',
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+Economiques?\s+et\s+de\s+Gestion/iu' => 'Sciences Économiques et de Gestion',
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+de\s+Gestion\s+Comptable/iu' => 'Sciences de Gestion Comptable',
        '/\bSGC\b/' => 'Sciences de Gestion Comptable',
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+Économiques?/iu' => 'Sciences Économiques',
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+Economiques?/iu' => 'Sciences Économiques',
        '/مسلك\s+العلوم?\s+الاقتصادية/u' => 'Sciences Économiques',
        '/مسلك\s+علوم?\s+التبدير\s+المحاسباتي/u' => 'Sciences de Gestion Comptable',

        // Sciences Mathématiques
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+Mathématiques?\s*[AB]?/iu' => 'Sciences Mathématiques',
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+Mathematiques?\s*[AB]?/iu' => 'Sciences Mathématiques',
        '/\bSM\s*[-_\s]*[AB]\b|\bSMA\b|\bSMB\b/' => 'Sciences Mathématiques',
        '/مسلك\s+العلوم?\s+الرياضية\s*[أب]?/u' => 'Sciences Mathématiques',

        // Sciences Expérimentales / Physiques / SVT
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+de\s+la\s+Vie\s+et\s+de\s+la\s+Terre/iu' => 'Sciences de la Vie et de la Terre',
        '/\bSVT\b/' => 'Sciences de la Vie et de la Terre',
        '/مسلك\s+علوم?\s+الحياة\s+والأرض/u' => 'Sciences de la Vie et de la Terre',
        '/مسلك\s+علوم?\s+الحياة\s+والارض/u' => 'Sciences de la Vie et de la Terre',

        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+Physiques?\s*(?:et\s+Chimie)?/iu' => 'Sciences Physiques',
        '/\bPC\b|\bSPC\b/' => 'Sciences Physiques',
        '/مسلك\s+العلوم?\s+الفيزيائية/u' => 'Sciences Physiques',

        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+Expérimentales?/iu' => 'Sciences Expérimentales',
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+Experimentales?/iu' => 'Sciences Expérimentales',
        '/مسلك\s+العلوم?\s+التجريبية/u' => 'Sciences Expérimentales',

        // Technical & Professional
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+et\s+Technologies?\s+Électriques?/iu' => 'Sciences et Technologies Électriques',
        '/(?:filière|série|option)?\s*:?\s*Sciences?\s+et\s+Technologies?\s+Mécaniques?/iu' => 'Sciences et Technologies Mécaniques',
        '/\bSTE\b/' => 'Sciences et Technologies Électriques',
        '/\bSTM\b/' => 'Sciences et Technologies Mécaniques',
        '/\bBAC\s*PRO(?:FESSIONNEL)?\b/i' => 'Baccalauréat Professionnel',

        // Letters & Human Sciences
        '/(?:filière|série|option)?\s*:?\s*Lettres?\s+(?:et\s+)?(?:Sciences?\s+Humaines?)?/iu' => 'Lettres et Sciences Humaines',
        '/مسلك\s+الآداب\s+(?:والعلوم\s+الإنسانية)?/u' => 'Lettres et Sciences Humaines',
        '/مسلك\s+الاداب/u' => 'Lettres et Sciences Humaines',
        '/مسلك\s+اللغات/u' => 'Langues',

        // Arabic & Islamic Studies
        '/(?:filière|série|option)?\s*:?\s*(?:Études|Etudes)\s+Islamiques?/iu' => 'Études Islamiques',
        '/الدراسات\s+الإسلامية/u' => 'Études Islamiques',
        '/التعليم\s+الأصيل/u' => 'Enseignement Originel',
    ];

    /**
     * Valid mention values
     */
    private array $validMentions = [
        'TRÈS BIEN',
        'TRES BIEN',
        'BIEN',
        'ASSEZ BIEN',
        'PASSABLE',
        'MOYEN',
        'EXCELLENT',
    ];

    /**
     * Extract normalized Bac filière / série label.
     */
    public function extractBacType(string $text): string
    {
        // Clean multiple spaces and normalize Unicode text
        $cleanText = preg_replace('/\s+/u', ' ', $text);

        foreach ($this->bacTypePatterns as $pattern => $label) {
            if (preg_match($pattern, $cleanText)) {
                return $label;
            }
        }

        // Fallback for strict context matching on short acronyms
        $acronyms = [
            'SE' => 'Sciences Économiques',
            'SP' => 'Sciences Physiques',
            'SM' => 'Sciences Mathématiques',
            'SVT' => 'Sciences de la Vie et de la Terre',
            'PC' => 'Sciences Physiques',
            'SGC' => 'Sciences de Gestion Comptable',
            'STE' => 'Sciences et Technologies Électriques',
            'STM' => 'Sciences et Technologies Mécaniques',
        ];

        foreach ($acronyms as $acronym => $label) {
            if (preg_match('/\b'.preg_quote($acronym, '/').'\b/i', $cleanText)) {
                return $label;
            }
        }

        return '';
    }

    /**
     * Extract Bac mention (Très Bien, Bien, Assez Bien, Passable).
     */
    public function extractBacMention(string $text): string
    {
        $cleanText = preg_replace('/\s+/u', ' ', $text);

        // Standard French Mention with keyword context
        if (preg_match('/(?:MENTION|ADMIS[^\n\r]*|DÉCISION|Mention)\s*[:\-]?\s*(TRÈS\s+BIEN|TRES\s+BIEN|BIEN|ASSEZ\s+BIEN|PASSABLE|MOYEN|EXCELLENT)/iu', $cleanText, $m)) {
            return $this->normalizeMention($m[1]);
        }

        // Arabic Mention matching
        $arabicMentions = [
            'حسن جدا' => 'TRÈS BIEN',
            'جيد جدا' => 'TRÈS BIEN',
            'حسن' => 'BIEN',
            'جيد' => 'BIEN',
            'مستحسن' => 'ASSEZ BIEN',
            'مقبول' => 'PASSABLE',
            'متوسط' => 'MOYEN',
            'ممتاز' => 'EXCELLENT',
        ];

        foreach ($arabicMentions as $arabic => $french) {
            if (preg_match('/(?:بميزة|ميزة)\s*[:\-]?\s*'.preg_quote($arabic, '/').'/u', $cleanText)) {
                return $french;
            }
        }

        // Strict French fallback without noisy captures
        if (preg_match('/\b(TRÈS\s+BIEN|TRES\s+BIEN|ASSEZ\s+BIEN|PASSABLE|MOYEN|EXCELLENT)\b/iu', $cleanText, $m)) {
            return $this->normalizeMention($m[1]);
        }

        return '';
    }

    /**
     * Extract Lycée / High School name in French or Arabic.
     */
    public function extractHighSchool(string $text): string
    {
        // Strategy 1: French High School extraction
        if (preg_match(
            '/(?:Etablissement|Établissement|Lycée\s*(?:Qualifiant)?|Lycee\s*(?:Qualifiant)?|Secondary\s+School)\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-zÉÈÊÀÙÎÔéèêàùîô0-9\s\'\-]+?)(?=\n|\r|$|Niveau|Deuxième|Direction|Code|Académie|Province|Ville)/iu',
            $text, $m
        )) {
            $school = trim(preg_replace('/\s+/', ' ', $m[1]));
            if (mb_strlen($school, 'UTF-8') >= 3) {
                return $school;
            }
        }

        // Strategy 2: Arabic High School extraction
        $arWord = '[\x{0600}-\x{06FF}]+';
        if (preg_match('/(?:مؤسسة|ثانوية|الثانوية)\s*[:\-]?\s*(ثانوية\s+'.$arWord.'(?:\s+'.$arWord.'){0,4})/u', $text, $m)) {
            $school = trim(preg_replace('/\s+/u', ' ', $m[1]));
            if (mb_strlen($school, 'UTF-8') >= 5) {
                return $school;
            }
        }

        // Strategy 3: Extract high school from text body
        if (preg_match('/\b(Lycée\s+[A-Z][A-Za-z\s\-]+|ثانوية\s+[\x{0600}-\x{06FF}\s]+)\b/u', $text, $m)) {
            return trim($m[1]);
        }

        return '';
    }

    /**
     * Extract Bac year (2023, 2024, etc.)
     */
    public function extractBacYear(string $text): ?int
    {
        $patterns = [
            '/(?:Session|Année|Année\s+Scolaire|سنة|الدورة)\s*[:\-]?\s*(20\d{2})/iu',
            '/Baccalauréat\s*(?:session\s*)?(20\d{2})/iu',
            '/\b(20\d{2})\b/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $text, $matches)) {
                foreach ($matches[1] as $year) {
                    $year = (int) $year;
                    if ($year >= 2000 && $year <= date('Y') + 2) {
                        return $year;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Extract session type (Normale, Rattrapage, etc.)
     */
    public function extractSession(string $text): string
    {
        $sessionPatterns = [
            '/Session\s*[:\.]?\s*(Normale|Rattrapage|Ordinaire|Janvier|Juin|Juillet|Septembre)/iu',
            '/دورة\s*[:\.]?\s*(العادية|الاستدراكية|الاستثنائية)/u',
        ];

        $sessionMap = [
            'Normale' => 'NORMALE',
            'Rattrapage' => 'RATTRAPAGE',
            'Ordinaire' => 'ORDINAIRE',
            'Janvier' => 'JANVIER',
            'Juin' => 'JUIN',
            'Juillet' => 'JUILLET',
            'Septembre' => 'SEPTEMBRE',
            'العادية' => 'NORMALE',
            'الاستدراكية' => 'RATTRAPAGE',
            'الاستثنائية' => 'EXCEPTIONNELLE',
        ];

        foreach ($sessionPatterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                $session = trim($m[1]);
                if (isset($sessionMap[$session])) {
                    return $sessionMap[$session];
                }

                return strtoupper($session);
            }
        }

        return '';
    }

    /**
     * Extract and validate average score
     */
    public function extractAverage(string $text): ?float
    {
        $patterns = [
            '/(?:Moyenne|Note|MOYENNE|Moy\.)\s*(?:Générale|العام)?\s*[:=]?\s*(\d{1,2}[\.,]\d{1,2})/iu',
            '/المعدل\s*[:\.]?\s*(\d{1,2}[\.,]\d{1,2})/u',
            '/MOYENNE\s*[:\.]?\s*(\d{1,2}[\.,]\d{2})/i',
            '/Moyenne\s*[:\.]?\s*(\d{1,2}[\.,]\d{2})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                $average = (float) str_replace(',', '.', $m[1]);
                if ($average >= 0 && $average <= 20) {
                    return round($average, 2);
                }
            }
        }

        return null;
    }

    /**
     * Helper to standardize French mentions.
     */
    private function normalizeMention(string $mention): string
    {
        $mention = mb_strtoupper(trim($mention), 'UTF-8');

        // Normalize "TRES" to "TRÈS"
        if (str_contains($mention, 'TRES') && ! str_contains($mention, 'TRÈS')) {
            $mention = str_replace('TRES', 'TRÈS', $mention);
        }

        // Validate mention
        if (in_array($mention, $this->validMentions)) {
            return $mention;
        }

        // Try to find closest match
        foreach ($this->validMentions as $valid) {
            if (str_contains($mention, str_replace(' ', '', $valid))) {
                return $valid;
            }
        }

        return $mention;
    }

    /**
     * Validate mention value
     */
    public function isValidMention(string $mention): bool
    {
        return in_array(strtoupper($mention), $this->validMentions);
    }

    /**
     * Get all valid mentions
     */
    public function getValidMentions(): array
    {
        return $this->validMentions;
    }

    /**
     * Extract Arabic bac type from text
     */
    public function extractArabicBacType(string $text): string
    {
        $mappings = [
            'علوم رياضية' => 'Sciences Mathématiques',
            'علوم تجريبية' => 'Sciences Expérimentales',
            'علوم اقتصادية' => 'Sciences Économiques',
            'علوم الحياة والأرض' => 'Sciences de la Vie et de la Terre',
            'علوم فيزيائية' => 'Sciences Physiques',
            'آداب' => 'Lettres',
            'لغات' => 'Langues',
        ];

        foreach ($mappings as $arabic => $french) {
            if (str_contains($text, $arabic)) {
                return $french;
            }
        }

        return '';
    }
}
