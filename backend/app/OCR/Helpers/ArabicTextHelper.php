<?php

namespace App\OCR\Helpers;

/**
 * Arabic Text Helper
 *
 * Centralises all Arabic-language logic:
 *  - Stop-word list (Ministry headers, exam vocabulary, OCR noise)
 *  - Token filtering
 *  - Arabic name extraction (multi-strategy)
 */
class ArabicTextHelper
{
    /**
     * Moroccan Ministry / State document stop-words (never candidate names).
     */
    private array $stopWords = [
        // ─── Ministry / Institution headers ───────────────────────────────────
        'المملكة', 'المغربية', 'وزارة', 'التربية', 'الوطنية', 'التكوين', 'المهني',
        'التعليم', 'العالي', 'البحث', 'العلمي', 'نيابة', 'أكاديمية', 'الأكاديمية',
        // ─── Exam / Certificate vocabulary ────────────────────────────────────
        'امتحانات', 'الامتحان', 'الوطني', 'الموحد', 'شهادة', 'البكالوريا', 'شعبة',
        'مسلك', 'رقم', 'الترشيح', 'الاسم', 'العائلي', 'الشخصي', 'بيان', 'النقط',
        'معدل', 'المعدل', 'العام', 'الدورة', 'العادية', 'الاستدراكية', 'سنة',
        // ─── CNIE / Birth certificate vocabulary ──────────────────────────────
        'مواليد', 'مكان', 'الازدياد', 'مواطن', 'البطاقة', 'الهوية',
        'التعريفية', 'المغرب', 'التعليمية', 'الجهوية', 'الإقليمية',
        'المديرية', 'الإقليم', 'العمالة', 'الجهة', 'الإقليمي', 'والتكوين',
        'للتربية', 'للتعليم', 'والتعليم', 'مديرية', 'الابتدائي', 'الثانوي',
        'التأهيلي', 'ثانوية', 'مؤسسة', 'ذكر', 'أنثى', 'المدينة', 'المنطقة',
        'الرباط', 'المحمدية', 'إرقم', 'البلحاقة', 'للتعريف', 'قد', 'نجم',
        // ─── BAC certificate boilerplate noise ────────────────────────────────
        'فر', 'ابتحانات', 'يونيو', 'حسن', 'الح', 'كعمد', 'الرقم', 'التللي',
        'يمكن', 'تليم', 'أي', 'هذه', 'الثمادة', 'ارقم', 'وا', 'العف', 'بلسي',
        'ثمادة', 'عا', 'تتام', 'مه', 'امناء', 'عملم', 'بتاع', 'المي', 'سمي',
        'لا', 'يي', 'مكيرة', 'متا', 'الل', 'الوأمنية', 'الأوثر', 'والرياضة',
        'ما', 'وثيقة', 'خاصة', 'بيار', 'المحص', 'قر', 'دده', 'نلصا', 'المحصل',
        'عليها', 'ببيان', 'شخصي', 'محصل',
        // ─── Tesseract OCR noise / hallucinations ────────────────────────────
        'وزير', 'يشمد', 'تصنت', 'عيبي', 'نزم', 'قاطمة', 'ححص', 'لصن', 'داوب', 'يسح', 'ذخ', 'صص', 'سمم', 'مقت',
        'اب', 'هم', 'به', 'من', 'في', 'أو', 'على', 'إلى', 'عن', 'مع', 'حالة', 'المدنية', 'الحالة', 'رقم',
        'هذا', 'هذه', 'ذلك', 'تلك', 'كان', 'كانت', 'يكون', 'تكون',
        'هناك', 'حيث', 'إذا', 'لكن', 'لأن', 'لذلك', 'ولذلك', 'كما',
        'بعد', 'قبل', 'بين', 'تحت', 'فوق', 'خلال', 'حول',
        // ─── Minister / Government roles (header text) ───────────────────────
        'وزيرة', 'مدير', 'مديرة', 'رئيس', 'رئيسة', 'عميد', 'الأمين',
        'العام', 'الأستاذ', 'الأستاذة', 'الدكتور', 'الدكتورة',
    ];

    /**
     * Filter a list of Arabic word strings against stop-words and minimum length.
     * Only keeps words of >= 3 characters that are not in the stop-word list.
     */
    public function filterTokens(array $words): array
    {
        $result = [];
        foreach ($words as $w) {
            $w = trim((string)$w);
            if ($w === '') continue;
            if (mb_strlen($w, 'UTF-8') < 3) continue;
            if (in_array($w, $this->stopWords, true)) continue;
            $result[] = $w;
        }
        return $result;
    }

    /**
     * Get all clean Arabic word tokens from a text (filtered, unique).
     * @deprecated Prefer extractName() with context-anchored strategies.
     */
    public function getCleanTokens(string $text): array
    {
        $tokens = [];
        if (preg_match_all('/[\x{0600}-\x{06FF}]{3,}/u', $text, $m)) {
            foreach ($m[0] as $w) {
                $w = trim($w);
                if (!in_array($w, $this->stopWords, true) && mb_strlen($w, 'UTF-8') >= 3) {
                    $tokens[] = $w;
                }
            }
        }
        return array_values(array_unique($tokens));
    }

    /**
     * Extract Arabic candidate name from OCR text.
     *
     * Strategy (ordered by confidence):
     *  1. BAC label:    «أن المترشح(ة) : النميلي فاطمة الزهراء»
     *  2. Relevé label: «الاسم العائلي : النميلي» + «الاسم الشخصي : فاطمة»
     *  3. Generic: Line containing only 1-4 Arabic words (>= 3 chars each)
     *  4. CNIE specific: name between «الاسم» and «تاريخ»
     *  5. Give up — never guess random words
     *
     * @return array{last_name_ar: string, first_name_ar: string}
     */
    public function extractName(string $text): array
    {
        $arWord = '[\x{0600}-\x{06FF}]+';

        // Strategy 1: BAC certificate label
        if (preg_match('/(?:أن\s+)?المترشح(?:ة|\(ة\))?\s*[:\-]?\s*(' . $arWord . '(?:\s+' . $arWord . '){0,3})/u', $text, $m)) {
            $tokens = $this->filterTokens(preg_split('/\s+/u', trim($m[1])));
            if (count($tokens) >= 1) {
                return [
                    'last_name_ar'  => $tokens[0],
                    'first_name_ar' => isset($tokens[1]) ? implode(' ', array_slice($tokens, 1, 2)) : '',
                ];
            }
        }

        // Strategy 2: Relevé labeled fields
        $lastName  = '';
        $firstName = '';
        if (preg_match('/(?:الاسم\s+العائلي|اللقب)\s*[:\-]?\s*(' . $arWord . '(?:\s+' . $arWord . ')?)/u', $text, $m)) {
            $t = $this->filterTokens([$m[1]]);
            $lastName = $t[0] ?? '';
        }
        if (preg_match('/(?:الاسم\s+الشخصي|الاسم\s+الأول)\s*[:\-]?\s*(' . $arWord . '(?:\s+' . $arWord . '){0,2})/u', $text, $m)) {
            $ts = $this->filterTokens(preg_split('/\s+/u', trim($m[1])));
            $firstName = implode(' ', $ts);
        }
        if ($lastName) {
            return ['last_name_ar' => $lastName, 'first_name_ar' => $firstName];
        }

        // Strategy 3: Line containing only Arabic words (2–4 clean words)
        foreach (preg_split('/[\r\n]+/', $text) as $line) {
            if (preg_match('/^\s*(' . $arWord . ')(?:\s+(' . $arWord . '))?(?:\s+(' . $arWord . '))?\s*$/u', trim($line), $m)) {
                $candidate = $this->filterTokens(array_values(array_filter(array_slice($m, 1))));
                $valid = array_filter($candidate, fn($w) => mb_strlen($w, 'UTF-8') >= 3);
                if (count($valid) >= 1 && count($candidate) <= 4) {
                    return [
                        'last_name_ar'  => $candidate[0],
                        'first_name_ar' => isset($candidate[1]) ? implode(' ', array_slice($candidate, 1, 2)) : '',
                    ];
                }
            }
        }

        // Strategy 4: CNIE specific — name between «الاسم» and «تاريخ»
        if (preg_match('/(?:الاسم|الإسم)\s+(' . $arWord . '(?:\s+' . $arWord . ')*?)\s+(?:تاريخ|مزداد)/u', $text, $m)) {
            $tokens = $this->filterTokens(preg_split('/\s+/u', trim($m[1])));
            if (count($tokens) >= 1) {
                return [
                    'last_name_ar'  => $tokens[0],
                    'first_name_ar' => isset($tokens[1]) ? implode(' ', array_slice($tokens, 1, 2)) : '',
                ];
            }
        }

        // Give up: never return random words
        return ['last_name_ar' => '', 'first_name_ar' => ''];
    }
}
