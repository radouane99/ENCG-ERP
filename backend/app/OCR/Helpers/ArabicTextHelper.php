<?php

namespace App\OCR\Helpers;

/**
 * Arabic Text Helper
 *
 * Centralises Arabic language processing for OCR extraction:
 *  - Arabic letter normalization (Alef, Tashkeel removal)
 *  - Stop-word list (Ministry headers, administrative terms, OCR noise)
 *  - Context-aware Arabic name extraction
 *  - Address parsing
 *  - Date parsing in Arabic format
 *
 * @version 2.0 Final
 */
class ArabicTextHelper
{
    /**
     * Moroccan Ministry / State document stop-words.
     */
    private array $stopWords = [
        // Ministry / Institution headers
        'المملكة', 'المغربية', 'وزارة', 'التربية', 'الوطنية', 'التكوين', 'المهني',
        'التعليم', 'العالي', 'البحث', 'العلمي', 'نيابة', 'أكاديمية', 'الأكاديمية',
        'الجهوية', 'الإقليمية', 'المديرية', 'الإقليم', 'العمالة', 'الجهة',
        // Exam / Certificate vocabulary
        'امتحانات', 'الامتحان', 'الوطني', 'الموحد', 'شهادة', 'البكالوريا', 'شعبة',
        'مسلك', 'رقم', 'الترشيح', 'الاسم', 'العائلي', 'الشخصي', 'بيان', 'النقط',
        'معدل', 'المعدل', 'العام', 'الدورة', 'العادية', 'الاستدراكية', 'سنة',
        'الدراسية', 'التعليمية', 'والتكوين', 'للتربية', 'للتعليم', 'والتعليم',
        // CNIE / Birth certificate vocabulary
        'مواليد', 'مكان', 'الازدياد', 'مواطن', 'البطاقة', 'الهوية',
        'التعريفية', 'المغرب', 'الابتدائي', 'الثانوي', 'التأهيلي',
        'ثانوية', 'مؤسسة', 'ذكر', 'أنثى', 'المدينة', 'المنطقة',
        'الرباط', 'المحمدية', 'للتعريف', 'حالة', 'المدنية', 'الحالة',
        'وزيرة', 'مدير', 'مديرة', 'رئيس', 'رئيسة', 'عميد', 'الأمين',
        'العام', 'المعرف', 'الجنسية', 'الولادة', 'الازدياد',
        // Additional administrative terms
        'الصفحة', 'الرئيسية', 'الملاحظة', 'المواد', 'المادة',
        'النقطة', 'النقاط', 'المراقبة', 'الامتحان', 'الجهوي',
    ];

    /**
     * Common Arabic name prefixes for compound names
     */
    private array $namePrefixes = [
        'بن', 'ابن', 'آيت', 'ايت', 'بو', 'أبو', 'عبد', 'عبدالله',
        'عبدالرحمن', 'عبدالرحيم', 'عبدالجليل', 'عبدالكريم',
    ];

    /**
     * Pre-normalized stop words cache for O(1) matching.
     */
    private array $normalizedStopWords = [];
    private array $normalizedPrefixes = [];

    public function __construct()
    {
        foreach ($this->stopWords as $word) {
            $this->normalizedStopWords[$this->normalizeArabic($word)] = true;
        }
        
        foreach ($this->namePrefixes as $prefix) {
            $this->normalizedPrefixes[$this->normalizeArabic($prefix)] = true;
        }
    }

    /**
     * Normalize Arabic string by removing Tashkeel and standardizing Alef variants.
     */
    public function normalizeArabic(string $text): string
    {
        // Strip Tashkeel (diacritics)
        $text = preg_replace('/[\x{064B}-\x{0652}]/u', '', $text);
        
        // Normalize Alef forms (أ, إ, آ -> ا)
        $text = preg_replace('/[أإآ]/u', 'ا', $text);
        
        // Normalize Yaa (ى -> ي)
        $text = preg_replace('/ى/u', 'ي', $text);
        
        // Normalize Teh Marbuta (ة -> ه)
        $text = preg_replace('/ة/u', 'ه', $text);
        
        // Normalize Waw with Hamza (ؤ -> و)
        $text = preg_replace('/ؤ/u', 'و', $text);
        
        // Normalize Alef with Hamza (ئ -> ي)
        $text = preg_replace('/ئ/u', 'ي', $text);

        return trim($text);
    }

    /**
     * Filter a list of Arabic words against stop-words and minimum length.
     */
    public function filterTokens(array $words): array
    {
        $result = [];
        foreach ($words as $w) {
            $w = trim((string)$w);
            if ($w === '') continue;

            $normalized = $this->normalizeArabic($w);

            // Minimum length check
            if (mb_strlen($normalized, 'UTF-8') < 2) continue;
            
            // Skip stop words
            if (isset($this->normalizedStopWords[$normalized])) continue;
            
            // Skip pure numbers
            if (preg_match('/^[\d\.,]+$/', $w)) continue;

            $result[] = $w;
        }
        return $result;
    }

    /**
     * Extract Arabic candidate name from OCR text.
     *
     * @return array{last_name_ar: string, first_name_ar: string}
     */
    public function extractName(string $text): array
    {
        $arWord = '[\x{0600}-\x{06FF}]+';

        // Strategy 1: BAC certificate label («أن المترشح(ة) : النميلي فاطمة الزهراء»)
        if (preg_match('/(?:أن\s+)?المترشح(?:ة|\(ة\))?\s*[:\-]?\s*(' . $arWord . '(?:\s+' . $arWord . '){0,4})/u', $text, $m)) {
            $tokens = $this->filterTokens(preg_split('/\s+/u', trim($m[1])));
            if (count($tokens) >= 1) {
                return $this->splitArabicNameTokens($tokens);
            }
        }

        // Strategy 2: Labeled fields («الاسم العائلي : ...» + «الاسم الشخصي : ...»)
        $lastName  = '';
        $firstName = '';

        if (preg_match('/(?:الاسم\s+العائلي|اللقب|النسب)\s*[:\-]?\s*(' . $arWord . '(?:\s+' . $arWord . '){0,3})/u', $text, $m)) {
            $t = $this->filterTokens(preg_split('/\s+/u', trim($m[1])));
            $lastName = implode(' ', $t);
        }

        if (preg_match('/(?:الاسم\s+الشخصي|الاسم\s+الأول|الاسم\s+الذاتي)\s*[:\-]?\s*(' . $arWord . '(?:\s+' . $arWord . '){0,3})/u', $text, $m)) {
            $ts = $this->filterTokens(preg_split('/\s+/u', trim($m[1])));
            $firstName = implode(' ', $ts);
        }

        if ($lastName || $firstName) {
            return [
                'last_name_ar' => $lastName, 
                'first_name_ar' => $firstName
            ];
        }

        // Strategy 3: Standalone Arabic line (2–4 valid name words)
        foreach (preg_split('/[\r\n]+/', $text) as $line) {
            $cleanLine = trim($line);
            if (preg_match('/^\s*(' . $arWord . '(?:\s+' . $arWord . '){1,3})\s*$/u', $cleanLine, $m)) {
                $rawTokens = preg_split('/\s+/u', trim($m[1]));
                $filtered = $this->filterTokens($rawTokens);

                if (count($filtered) >= 2 && count($filtered) <= 4) {
                    return $this->splitArabicNameTokens($filtered);
                }
            }
        }

        // Strategy 4: CNIE card layout («الاسم» ... «تاريخ»)
        if (preg_match('/(?:الاسم|الإسم)\s+(' . $arWord . '(?:\s+' . $arWord . ')*?)\s+(?:تاريخ|مزداد|الازدياد)/u', $text, $m)) {
            $tokens = $this->filterTokens(preg_split('/\s+/u', trim($m[1])));
            if (count($tokens) >= 1) {
                return $this->splitArabicNameTokens($tokens);
            }
        }

        // Strategy 5: Full name pattern with common prefixes
        if (preg_match('/(' . $arWord . '(?:\s+' . $arWord . '){1,4})/u', $text, $m)) {
            $tokens = $this->filterTokens(preg_split('/\s+/u', trim($m[1])));
            if (count($tokens) >= 2) {
                return $this->splitArabicNameTokens($tokens);
            }
        }

        return ['last_name_ar' => '', 'first_name_ar' => ''];
    }

    /**
     * Extract Arabic address from text
     */
    public function extractAddress(string $text): string
    {
        $patterns = [
            '/(?:العنوان|العنوان\s+الكامل)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s0-9\-\,\.]+)/u',
            '/(?:الشارع|زنقة|دوار|حي|طريق)\s+([\x{0600}-\x{06FF}\s0-9]+)/u',
            '/(?:المدينة|المنطقة)\s*[:\.]?\s*([\x{0600}-\x{06FF}\s]+)/u',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $address = trim($match[1]);
                if (mb_strlen($address, 'UTF-8') > 3) {
                    return $this->normalizeArabic($address);
                }
            }
        }

        return '';
    }

    /**
     * Extract Arabic date from text
     */
    public function extractDate(string $text): ?string
    {
        $patterns = [
            '/(\d{2})\s*[\/\-\.]\s*(\d{2})\s*[\/\-\.]\s*(\d{4})/',
            '/(\d{2})\s+(\d{2})\s+(\d{4})/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                return "{$match[3]}-{$match[2]}-{$match[1]}";
            }
        }

        // Arabic format: يوم DD شهر MM سنة YYYY
        if (preg_match('/(?:يوم|بتاريخ)\s*(\d{1,2})\s*(?:شهر)?\s*(\d{1,2})\s*(?:سنة)?\s*(\d{4})/u', $text, $match)) {
            return "{$match[3]}-{$match[2]}-{$match[1]}";
        }

        return null;
    }

    /**
     * Helper to split filtered tokens into last_name and first_name,
     * handling common Arabic compound name prefixes (عبد, آيت, بن, الدين).
     */
    private function splitArabicNameTokens(array $tokens): array
    {
        if (count($tokens) === 1) {
            return ['last_name_ar' => $tokens[0], 'first_name_ar' => ''];
        }

        // Handle compound family name prefixes
        $firstNormalized = $this->normalizeArabic($tokens[0]);

        if (isset($this->normalizedPrefixes[$firstNormalized]) && isset($tokens[1])) {
            $secondNormalized = $this->normalizeArabic($tokens[1]);
            
            // Handle double prefix like "آيت بن"
            if (isset($this->normalizedPrefixes[$secondNormalized]) && isset($tokens[2])) {
                $lastName = $tokens[0] . ' ' . $tokens[1] . ' ' . $tokens[2];
                $firstName = implode(' ', array_slice($tokens, 3));
            } else {
                $lastName = $tokens[0] . ' ' . $tokens[1];
                $firstName = implode(' ', array_slice($tokens, 2));
            }
        } else {
            // Last token is often the first name in Arabic context
            $lastName = $tokens[0];
            $firstName = implode(' ', array_slice($tokens, 1));
        }

        // Clean up empty first name
        if (empty(trim($firstName))) {
            $firstName = '';
        }

        return [
            'last_name_ar'  => trim($lastName),
            'first_name_ar' => trim($firstName),
        ];
    }

    /**
     * Check if text contains Arabic script
     */
    public function hasArabicScript(string $text): bool
    {
        return preg_match('/[\x{0600}-\x{06FF}]/u', $text) === 1;
    }

    /**
     * Extract Arabic words from text
     */
    public function extractArabicWords(string $text): array
    {
        preg_match_all('/[\x{0600}-\x{06FF}]+/u', $text, $matches);
        return $matches[0] ?? [];
    }

    /**
     * Remove Arabic diacritics (Tashkeel)
     */
    public function removeDiacritics(string $text): string
    {
        return preg_replace('/[\x{064B}-\x{0652}]/u', '', $text);
    }

    /**
     * Detect if a string is likely an Arabic name
     */
    public function isLikelyArabicName(string $text): bool
    {
        $text = trim($text);
        if (empty($text)) return false;
        
        // Check for Arabic script
        if (!$this->hasArabicScript($text)) return false;
        
        // Check length (Arabic names are usually 2-5 words)
        $words = preg_split('/\s+/u', $text);
        if (count($words) < 1 || count($words) > 6) return false;
        
        // Filter tokens
        $filtered = $this->filterTokens($words);
        return count($filtered) >= 1;
    }
}