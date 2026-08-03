<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Log;

/**
 * LocalOcrService — 100% FREE, 100% LOCAL OCR
 *
 * Architecture: ONE dedicated parser per document type.
 *
 * ┌─────────────────┬────────────────────────────────────────────────────┐
 * │ docType         │ Fields extracted                                   │
 * ├─────────────────┼────────────────────────────────────────────────────┤
 * │ bac             │ cne, cin, names (fr/ar), bac_type, bac_mention,   │
 * │                 │ academy, prefecture, high_school                   │
 * ├─────────────────┼────────────────────────────────────────────────────┤
 * │ releve_notes    │ cne, cin, names (fr/ar), bac_average, bac_mention, │
 * │                 │ bac_type, high_school, academy, prefecture         │
 * ├─────────────────┼────────────────────────────────────────────────────┤
 * │ cnie / cin      │ cin, names (fr/ar), birth_date, birth_city (fr/ar) │
 * │ [RECTO]         │                                                    │
 * ├─────────────────┼────────────────────────────────────────────────────┤
 * │ cnie / cin      │ father_name (fr/ar), mother_name (fr/ar),         │
 * │ [VERSO]         │ address_fr, address_ar                            │
 * └─────────────────┴────────────────────────────────────────────────────┘
 *
 * No API keys. No internet. No cost. Runs entirely inside Docker.
 */
class LocalOcrService
{
    public ?string $lastError = null;

    // Moroccan Ministry / State document stop-words (never candidate names)
    private array $arabicStopWords = [
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
     * Main entry point — mirrors GeminiApiService::extractDocumentOcr()
     */
    public function extractDocumentOcr(
        string $filePath,
        string $mimeType,
        ?string $originalName = null,
        string $docType = 'bac'
    ): array {
        $empty = $this->emptyResult();

        if (!file_exists($filePath)) {
            $this->lastError = 'File not found: ' . $filePath;
            return $empty;
        }

        Log::info("[LocalOCR] Processing docType={$docType} | mime={$mimeType} | file={$originalName}");

        $text = $this->extractText($filePath, $mimeType, strtolower($docType));

        if (strlen(trim($text)) < 20) {
            $this->lastError = 'Not enough text extracted for local parsing';
            return $empty;
        }

        Log::info('[LocalOCR] Extracted ' . strlen($text) . ' chars. FULL TEXT: ' . $text);
        @file_put_contents(
            storage_path('logs/ocr_debug.txt'),
            "=== " . date('Y-m-d H:i:s') . " docType={$docType} file={$originalName} ===\n" .
            "RAW_TEXT:\n" . $text . "\n=========================================\n\n",
            FILE_APPEND
        );

        // Route to the appropriate dedicated parser
        $result = match (strtolower($docType)) {
            'releve', 'releve_notes', 'notes' => $this->parseReleve($text),
            'cnie', 'cin'                      => $this->parseCnie($text),
            default                            => $this->parseBac($text),   // bac, attestation_bac
        };

        Log::info('[LocalOCR] Parsed result:', $result);
        @file_put_contents(
            storage_path('logs/ocr_debug.txt'),
            "PARSED_RESULT:\n" . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n-----------------------------------------\n\n",
            FILE_APPEND
        );

        $this->lastError = null;
        return $result;
    }

    // ══════════════════════════════════════════════════════════════════════
    // DOCUMENT-TYPE PARSERS
    // ══════════════════════════════════════════════════════════════════════

    /**
     * BAC (Attestation de Baccalauréat) Parser
     *
     * Extracts ONLY academic identification fields — not grades.
     * Fields: cne, cin, first_name_fr, last_name_fr, first_name_ar, last_name_ar,
     *         bac_type, bac_mention, academy, prefecture, high_school
     */
    private function parseBac(string $text): array
    {
        $result = $this->emptyResult();

        // ── CNE / Code Massar (letter + 8-9 digits, e.g. H148073298)
        if (preg_match('/(?:CNE|Code\s+Massar|Code\s+Candidat|Massar|élève|Candidat)\s*[:\.\-]?\s*([A-Za-z]\d{8,9}|\d{10})/i', $text, $m)) {
            $result['cne'] = strtoupper(trim($m[1]));
        } elseif (preg_match('/\b([A-Za-z]\d{8,9})\b/', $text, $m)) {
            $result['cne'] = strtoupper(trim($m[1]));
        }

        // ── CIN (e.g. ZG195334 — printed next to "Numéro de la Carte Nationale d'Identité (*)")
        if (preg_match('/(?:Num[eé]ro\s+de\s+la\s+Carte\s+Nationale|Carte\s+Nationale\s+d[\'\']Identit[eé]|Carte\s+Nationale|CIN|CNIE)\s*(?:\(\*\))?\s*[:\.\-]?\s*([A-Za-z]{1,2}\d{5,8})/i', $text, $m)) {
            $cin = strtoupper(trim($m[1]));
            if ($cin !== $result['cne']) $result['cin'] = $cin;
        } elseif (preg_match('/\b([A-Za-z]{1,2}\d{5,8})\b/', $text, $m)) {
            $candidate = strtoupper(trim($m[1]));
            if ($candidate !== $result['cne']) {
                $result['cin'] = $candidate;
            }
        }

        // ── French Name: "Que le(a) candidat(e) : ENMILI FATIMA-ZAHRA"
        $result = array_merge($result, $this->extractFrenchName($text));

        // ── Arabic Name: "أن المترشح(ة) : النميلي فاطمة الزهراء"
        $result = array_merge($result, $this->extractArabicName($text));

        // ── Bac Type (filière / série)
        $result['bac_type'] = $this->extractBacType($text);

        // ── Bac Mention
        $result['bac_mention'] = $this->extractBacMention($text);

        // ── Academy (e.g. ACADÉMIE RÉGIONALE D'ÉDUCATION ET DE FORMATION ORIENTAL / الشرق)
        if (preg_match('/ACAD[EÉ]MIE\s+R[EÉ]GIONALE\s+D[\'\']E?DUCATION[^\n\r]*?\s+([A-ZÉÈÊÀÙÎÔ\s\-]{3,30})/iu', $text, $m)) {
            $result['academy'] = "ACADÉMIE " . trim($m[1]);
        } elseif (preg_match('/أكاديمية\s+([\x{0600}-\x{06FF}\s]+)/u', $text, $m)) {
            $result['academy'] = "أكاديمية " . trim($m[1]);
        }

        // ── Prefecture / Province (e.g. Direction Provinciale : PROVINCE: GUERCIF)
        if (preg_match('/(?:Direction\s+Provinciale|Province|Préfecture)\s*[:\-]?\s*(?:PROVINCE\s*[:\-]?)?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-zÉÈÊÀÙÎÔ\s\-]+?)(?=\n|\r|$|e\b)/iu', $text, $m)) {
            $result['prefecture'] = trim($m[1]);
        } elseif (preg_match('/إقليم\s*[:\-]?\s*([\x{0600}-\x{06FF}\s]+)/u', $text, $m)) {
            $result['prefecture'] = trim($m[1]);
        }

        // ── Lycée / High School (e.g. inscrit(e) à l'établissement : LYCEE QUALIFIANT EL HASSAN ADDAKHIL)
        $result['high_school'] = $this->extractHighSchool($text);

        return $result;
    }

    /**
     * RELEVÉ DE NOTES Parser
     *
     * Extracts academic + grade fields from the official Moroccan transcript.
     * Fields: cne, cin, first_name_fr, last_name_fr, first_name_ar, last_name_ar,
     *         bac_average, bac_mention, bac_type, high_school, academy, prefecture
     *
     * Note: birth_date / address / parents are NOT on a Relevé de Notes.
     */
    private function parseReleve(string $text): array
    {
        $result = $this->emptyResult();

        // ── CNE / Code Candidat (e.g. H148073298)
        if (preg_match('/(?:Code\s+Candidat|Code\s+Massar|CNE|Code\s+élève)\s*[:\.\-]?\s*([A-Za-z]\d{8,9}|\d{10})/i', $text, $m)) {
            $result['cne'] = strtoupper(trim($m[1]));
        } elseif (preg_match('/\b([A-Za-z]\d{8,9})\b/', $text, $m)) {
            $result['cne'] = strtoupper(trim($m[1]));
        }

        // ── CIN (e.g. ZG195334 — labeled "CNIE : ZG195334")
        if (preg_match('/(?:CNIE|CIN|Carte\s+Nationale)\s*[:\.\-]?\s*([A-Za-z]{1,2}\d{5,8})/i', $text, $m)) {
            $cin = strtoupper(trim($m[1]));
            if ($cin !== $result['cne']) $result['cin'] = $cin;
        }

        // ── French Name: "Nom et Prénom : ENMILI FATIMA-ZAHRA"
        if (preg_match('/Nom\s+et\s+Pr[eé]nom\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-ZÉÈÊÀÙÎÔ\-\s]{2,60}?)(?=\s{2,}|\t|Code|CNIE|\n|\r|$)/u', $text, $m)) {
            $fullName = trim(preg_replace('/\s+/', ' ', $m[1]));
            $fullName = preg_replace('/\s+[A-Z]{1,2}\d{5,8}.*$/i', '', $fullName);
            $parts = preg_split('/\s+/', $fullName, 2);
            $result['last_name_fr']  = $parts[0] ?? '';
            $result['first_name_fr'] = $parts[1] ?? '';
        } else {
            $names = $this->extractFrenchName($text);
            $result['last_name_fr']  = $names['last_name_fr'];
            $result['first_name_fr'] = $names['first_name_fr'];
        }

        // ── Arabic Name (candidate only)
        $result = array_merge($result, $this->extractArabicName($text));

        // ── BAC AVERAGE — "MOY. GENERALE : 15.41" (bulletproof multi-line / spacing matching)
        if (preg_match('/MOY[^\n\r]*?GENERALE[\s\S]{0,100}?(\b1[0-9][\.,]\d{1,3}\b|\b20[\.,]00\b)/i', $text, $m)) {
            $result['bac_average'] = str_replace(',', '.', $m[1]);
        } elseif (preg_match('/(?:MOY(?:ENNE)?|GENERALE|DECISION|JURY)[^\n\r]*?(\b1[0-9][\.,]\d{1,3}\b)/i', $text, $m)) {
            $result['bac_average'] = str_replace(',', '.', $m[1]);
        } elseif (preg_match('/(\b1[0-9]\.\d{2}\b)/', $text, $m)) {
            $result['bac_average'] = $m[1];
        }

        // ── Mention: "ADMIS (E) AVEC MENTION BIEN"
        $result['bac_mention'] = $this->extractBacMention($text);

        // ── Bac Type (filière): "Niveau : 2ÈME ANNÉE BAC SCIENCES ECONOMIQUES"
        if (preg_match('/Niveau\s*[:\-]?\s*(?:2[ÈE]ME\s+ANN[EÉ]E\s+BAC\s+)?([A-ZÉÈÊÀÙÎÔ\s\-]+?)(?=\n|\r|Deuxième|$)/iu', $text, $m)) {
            $result['bac_type'] = $this->extractBacType(trim($m[1])) ?: trim($m[1]);
        } else {
            $result['bac_type'] = $this->extractBacType($text);
        }

        // ── Lycée / Etablissement: "Etablissement : LYCEE QUALIFIANT EL HASSAN ADDAKHIL"
        if (preg_match('/Etablissement\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-zÉÈÊÀÙÎÔéèêàùîô\s\'\-]+?)(?=\n|\r|Niveau|Direction|$)/iu', $text, $m)) {
            $result['high_school'] = trim(preg_replace('/\s+/', ' ', $m[1]));
        } else {
            $result['high_school'] = $this->extractHighSchool($text);
        }

        // ── Direction Provinciale: "Direction Provinciale : PROVINCE: GUERCIF"
        if (preg_match('/Direction\s+Provinciale\s*[:\-]?\s*(?:PROVINCE\s*[:\-]?)?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-zÉÈÊÀÙÎÔ\s\-]+?)(?=\n|\r|$)/iu', $text, $m)) {
            $result['prefecture'] = trim($m[1]);
        }

        return $result;
    }

    /**
     * CNIE (Carte Nationale d'Identité Électronique) Parser
     *
     * Handles BOTH Recto and Verso (Multi-page PDF or single image).
     * Uses exhaustive fuzzy matching to handle all Tesseract OCR variations.
     */
    private function parseCnie(string $text): array
    {
        $result = $this->emptyResult();

        // Normalize: collapse multiple spaces, unify line endings
        $text = preg_replace('/\r\n|\r/', "\n", $text);
        $lines = array_map('trim', explode("\n", $text));
        $textNorm = implode("\n", array_filter($lines));

        // ════════════════════════════════════════════════════════
        // 1. MRZ — Machine-Readable Zone (Verso & Biometric CNIE)
        //    Line 1: IDMAROPIBM3CM<7CD987867<<<<<<<
        //    Line 2: 0809247M3405086MAR<<<<<<<<<<<2
        //    Line 3: BOUKIR<<BADR<<<<<<<<<<<<<<<<<<
        // ════════════════════════════════════════════════════════

        // 1a. MRZ Names: LASTNAME<<FIRSTNAME
        if (preg_match_all('/([A-Z]{2,30})<<([A-Z<]{2,60})/i', $textNorm, $allMrzNames, PREG_SET_ORDER)) {
            foreach ($allMrzNames as $mMatch) {
                $lastCand = trim(str_replace('<', '', $mMatch[1]));
                $firstCand = trim(str_replace('<', ' ', $mMatch[2]));

                if (preg_match('/^(IDMARO|IDMAR|MAR|CAN|FRA|CARD)$/i', $lastCand)) {
                    continue;
                }

                if (strlen($lastCand) >= 2) {
                    $result['last_name_fr'] = strtoupper($lastCand);
                }
                if (strlen($firstCand) >= 2) {
                    $result['first_name_fr'] = strtoupper(preg_replace('/\s+/', ' ', $firstCand));
                }
                break;
            }
        }

        // 1b. MRZ CIN Number: e.g. CD987867<<<<<<<
        if (preg_match('/([A-Z]{1,2}\d{5,7})<{2,}/i', $textNorm, $mrzCin)) {
            $result['cin'] = strtoupper($mrzCin[1]);
        } elseif (preg_match('/IDMAR[A-Z0-9<]*?([A-Z]{1,2}\d{5,7})\b/i', $textNorm, $mrzCin2)) {
            $result['cin'] = strtoupper($mrzCin2[1]);
        }

        // 1c. MRZ Birth Date: YYMMDD
        if (preg_match('/(?:\n|^)(\d{2})(\d{2})(\d{2})[0-9FM]/m', $textNorm, $mrzDob)) {
            $yyStr = $mrzDob[1];
            $mmStr = $mrzDob[2];
            $ddStr = $mrzDob[3];
            $yyInt = (int)$yyStr;
            if ((int)$mmStr >= 1 && (int)$mmStr <= 12 && (int)$ddStr >= 1 && (int)$ddStr <= 31) {
                $fullYear = $yyInt > 30 ? "19{$yyStr}" : "20{$yyStr}";
                $result['birth_date'] = "{$fullYear}-{$mmStr}-{$ddStr}";
            }
        }

        // ════════════════════════════════════════════════════════
        // 2. CIN Number — Fallback if MRZ missing
        // ════════════════════════════════════════════════════════
        if (empty($result['cin'])) {
            // Labeled patterns first (e.g. "N° ZG195334" or "رقم N° 00987867")
            if (preg_match('/(?:N[o°]|رقم|CIN|CNIE|Carte\s+Nationale)\s*[:\.]?\s*([A-Z]{1,2}\d{5,7})\b/iu', $textNorm, $m)) {
                $result['cin'] = strtoupper(trim($m[1]));
            }
            if (empty($result['cin'])) {
                if (preg_match_all('/\b([A-Za-z]{1,2}\d{5,7})\b/', $textNorm, $allCins)) {
                    foreach ($allCins[1] as $c) {
                        $cUpper = strtoupper(trim($c));
                        if (preg_match('/^[A-Z]\d{8,9}$/', $cUpper)) continue;
                        if (in_array($cUpper, ['MAROC', 'ROYAUME', 'CAN', 'FRA', 'IDMARO', 'IDMAR'], true)) continue;
                        $result['cin'] = $cUpper;
                        break;
                    }
                }
            }
        }

        // ════════════════════════════════════════════════════════
        // 3. French & Arabic Names Alignment (Cross-language OCR)
        // ════════════════════════════════════════════════════════
        if (!empty($result['first_name_fr']) && empty($result['first_name_ar'])) {
            if (preg_match('/([\x{0600}-\x{06FF}]+)\s*\n\s*' . preg_quote($result['first_name_fr'], '/') . '/iu', $textNorm, $mAr)) {
                $v = $this->filterArabicTokens([$mAr[1]]);
                if (!empty($v[0])) $result['first_name_ar'] = $v[0];
            }
        }
        if (!empty($result['last_name_fr']) && empty($result['last_name_ar'])) {
            if (preg_match('/([\x{0600}-\x{06FF}]+)\s*\n\s*' . preg_quote($result['last_name_fr'], '/') . '/iu', $textNorm, $mAr)) {
                $v = $this->filterArabicTokens([$mAr[1]]);
                if (!empty($v[0])) $result['last_name_ar'] = $v[0];
            }
        }



        // ════════════════════════════════════════════════════════
        // 3. French Names — Multiple label variations (Case-Insensitive)
        // ════════════════════════════════════════════════════════
        $frNameAnchorPatterns = [
            '/(?:NOM|Nom|Nom\s*\/[^\n]*)\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ\-\s]{2,40})/iu',
            '/اللقب\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ\-\s]{2,40})/u',
        ];
        if (empty($result['last_name_fr'])) {
            foreach ($frNameAnchorPatterns as $pat) {
                if (preg_match($pat, $textNorm, $m)) {
                    $v = trim(preg_replace('/\s+/', ' ', $m[1]));
                    $v = preg_replace('/\s+(?:PR[EÉ]NOM|Prénom|الاسم|Né|Née|à|le).*$/iu', '', $v);
                    if (strlen($v) >= 2 && !preg_match('/^(ROYAUME|MAROC|CARTE|NATIONALE|IDENTITE|VALABLE)/i', $v)) {
                        $result['last_name_fr'] = $v;
                        break;
                    }
                }
            }
        }

        $frFirstAnchorPatterns = [
            '/(?:PR[EÉ]NOM|Prénom|Given\s+name)\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ\-\s]{2,40})/iu',
            '/الاسم\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ\-\s]{2,40})/u',
        ];
        if (empty($result['first_name_fr'])) {
            foreach ($frFirstAnchorPatterns as $pat) {
                if (preg_match($pat, $textNorm, $m)) {
                    $v = trim(preg_replace('/\s+/', ' ', $m[1]));
                    $v = preg_replace('/\s+(?:Né|Née|à|le|Sexe|Sex|Date).*$/iu', '', $v);
                    if (strlen($v) >= 2 && !preg_match('/^(ROYAUME|MAROC|CARTE|NATIONALE|IDENTITE|VALABLE)/i', $v)) {
                        $result['first_name_fr'] = $v;
                        break;
                    }
                }
            }
        }

        // Fallback: use generic extractFrenchName
        if (empty($result['last_name_fr']) || empty($result['first_name_fr'])) {
            $names = $this->extractFrenchName($textNorm);
            if (empty($result['last_name_fr']))  $result['last_name_fr']  = $names['last_name_fr'];
            if (empty($result['first_name_fr'])) $result['first_name_fr'] = $names['first_name_fr'];
        }

        // Standalone uppercase words fallback (for CNIE cards where name is printed alone e.g. BADR / BOUKIR)
        if (empty($result['last_name_fr']) || empty($result['first_name_fr'])) {
            $words = [];
            if (preg_match_all('/\b([A-ZÉÈÊÀÙÎÔ]{3,30})\b/u', $textNorm, $mWords)) {
                foreach ($mWords[1] as $w) {
                    if (in_array($w, ['ROYAUME', 'MAROC', 'CARTE', 'NATIONALE', 'IDENTITE', 'VALABLE', 'ETAT', 'CIVIL', 'DATE', 'SEXE', 'LIEU', 'DU', 'DE', 'LA', 'MAR', 'CAN', 'FRA', 'MRS', 'MR', 'MME', 'MISS', 'NO', 'NUM', 'SIGNATURE', 'PHOTO', 'TITULAIRE'], true)) continue;
                    $words[] = $w;
                }
            }
            $words = array_values(array_unique($words));
            if (empty($result['last_name_fr']) && !empty($words[0])) $result['last_name_fr'] = $words[0];
            if (empty($result['first_name_fr']) && !empty($words[1])) $result['first_name_fr'] = $words[1];
        }



        // ════════════════════════════════════════════════════════
        // 4. Arabic Names — Context-anchored strategies
        // ════════════════════════════════════════════════════════
        $arW = '[\x{0600}-\x{06FF}]+';

        // Strategy A: labeled fields "اللقب : النميلي" / "الاسم : فاطمة الزهراء"
        if (preg_match('/(?:اللقب|الاسم\s+العائلي)\s*[:\.]?\s*(' . $arW . '(?:\s+' . $arW . ')?)/u', $textNorm, $m)) {
            $v = $this->filterArabicTokens(preg_split('/\s+/u', trim($m[1])));
            if (!empty($v[0])) $result['last_name_ar'] = $v[0];
        }
        if (preg_match('/(?:الاسم(?:\s+الشخصي)?)\s*[:\.]?\s*(' . $arW . '(?:\s+' . $arW . '){0,2})/u', $textNorm, $m)) {
            $v = $this->filterArabicTokens(preg_split('/\s+/u', trim($m[1])));
            if (!empty($v)) $result['first_name_ar'] = implode(' ', $v);
        }

        // Strategy B: generic extractArabicName
        if (empty($result['last_name_ar'])) {
            $arNames = $this->extractArabicName($textNorm);
            if (!empty($arNames['last_name_ar']))  $result['last_name_ar']  = $arNames['last_name_ar'];
            if (!empty($arNames['first_name_ar']) && empty($result['first_name_ar'])) $result['first_name_ar'] = $arNames['first_name_ar'];
        }

        // ════════════════════════════════════════════════════════
        // 5. Birth Date — Many Tesseract OCR variations
        // ════════════════════════════════════════════════════════
        if (empty($result['birth_date'])) {
            $dobPatterns = [
                '/N[eé][e]?(?:\s*\(e\))?\s+le\s*[:\.]?\s*(\d{2}[\.\/\-]\d{2}[\.\/\-]\d{4})/iu',
                '/مزداد(?:ة)?\s+بتاريخ\s*[:\.]?\s*(\d{2}[\.\/\-]\d{2}[\.\/\-]\d{4})/u',
                '/تاريخ\s+الازدياد\s*[:\.]?\s*(\d{2}[\.\/\-]\d{2}[\.\/\-]\d{4})/u',
                '/Date\s+de\s+naissance\s*[:\.]?\s*(\d{2}[\.\/\-]\d{2}[\.\/\-]\d{4})/iu',
                '/(\d{2})[\.\/\-](\d{2})[\.\/\-](20\d{2}|19\d{2})/',  // raw date anywhere
            ];
            foreach ($dobPatterns as $pat) {
                if (preg_match($pat, $textNorm, $m)) {
                    if (isset($m[3])) {
                        // Was captured in 3 groups
                        $result['birth_date'] = "{$m[3]}-{$m[2]}-{$m[1]}";
                    } else {
                        $raw = $m[1];
                        if (preg_match('/^(\d{2})[\.\/\-](\d{2})[\.\/\-](\d{4})$/', $raw, $d)) {
                            $result['birth_date'] = "{$d[3]}-{$d[2]}-{$d[1]}";
                        }
                    }
                    break;
                }
            }
        }

        // ════════════════════════════════════════════════════════
        // 6. Birth City
        // ════════════════════════════════════════════════════════
        // French: "à GUERCIF" or "Lieu de naissance : GUERCIF"
        $bcFrPatterns = [
            '/(?:Lieu\s+de\s+naissance|Née?\s+[àa])\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ][a-zA-ZÉÈÊÀÙÎÔéèêàùîô\s\-]{1,40}?)(?=\s{2,}|\n|\r|Valable|صالحة|$)/iu',
            '/\b[àa]\s+([A-ZÉÈÊÀÙÎÔ][a-zA-ZÉÈÊÀÙÎÔéèêàùîô\s\-]{1,30}?)(?=\s{2,}|\n|\r|Valable|صالحة|$)/u',
        ];
        foreach ($bcFrPatterns as $pat) {
            if (preg_match($pat, $textNorm, $m)) {
                $v = trim($m[1]);
                if (!preg_match('/^(la|le|les|carte|nationale|royaume|maroc)/i', $v)) {
                    $result['birth_city_fr'] = $v;
                    break;
                }
            }
        }
        // Arabic: "ب كرسيف" or "مكان الازدياد : كرسيف"
        $bcArPatterns = [
            '/مكان\s+(?:الازدياد|الولادة)\s*[:\.]?\s*(' . $arW . '(?:\s+' . $arW . ')?)/u',
            '/(?:^|[\s\n])ب\s+(' . $arW . '(?:\s+' . $arW . ')?)/mu',
        ];
        foreach ($bcArPatterns as $pat) {
            if (preg_match($pat, $textNorm, $m)) {
                $v = $this->filterArabicTokens(preg_split('/\s+/u', trim($m[1])));
                if (!empty($v)) { $result['birth_city_ar'] = implode(' ', $v); break; }
            }
        }

        // ════════════════════════════════════════════════════════
        // 7. VERSO — Parents & Address
        // ════════════════════════════════════════════════════════

        // Father FR: "Fils/Fille de JAWAD ben HMIDA" or "Père : JAWAD BEN HMIDA"
        $fatherFrPatterns = [
            '/(?:Fille?|Fils)\s+de\s+([A-ZÉÈÊÀÙÎÔ\s\-]+?)(?=\s+[Ee]t\s+de|\n|$)/i',
            '/(?:P[eè]re|Father)\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ\s\-]+?)(?=\n|\r|$)/i',
        ];
        foreach ($fatherFrPatterns as $pat) {
            if (preg_match($pat, $textNorm, $m)) {
                $result['father_name_fr'] = trim(preg_replace('/\s+/', ' ', $m[1])); break;
            }
        }
        // Mother FR: "Et de AMINA bent BOUCHTA" or "Mère : AMINA BENT BOUCHTA"
        $motherFrPatterns = [
            '/[Ee]t\s+de\s+([A-ZÉÈÊÀÙÎÔ\s\-]+?)(?=\s+Adresse?|\n|\r|$)/i',
            '/(?:M[eè]re|Mother)\s*[:\.]?\s*([A-ZÉÈÊÀÙÎÔ\s\-]+?)(?=\n|\r|$)/i',
        ];
        foreach ($motherFrPatterns as $pat) {
            if (preg_match($pat, $textNorm, $m)) {
                $result['mother_name_fr'] = trim(preg_replace('/\s+/', ' ', $m[1])); break;
            }
        }
        // Father AR: "بن / ابن + name"
        if (preg_match('/(?:بنت|بن|ابن)\s+(' . $arW . '(?:\s+' . $arW . ')*?)(?=\s+و|\s+العنوان|\n|$)/u', $textNorm, $m)) {
            $v = $this->filterArabicTokens(preg_split('/\s+/u', trim($m[1])));
            if (!empty($v)) $result['father_name_ar'] = implode(' ', $v);
        }
        // Mother AR: "و + name" (after father name)
        if (preg_match('/(?<=\n)و\s+(' . $arW . '(?:\s+' . $arW . ')*?)(?=\s+العنوان|\n|$)/u', $textNorm, $m)) {
            $v = $this->filterArabicTokens(preg_split('/\s+/u', trim($m[1])));
            if (!empty($v)) $result['mother_name_ar'] = implode(' ', $v);
        }

        // Address FR: "Adresse : DOUAR OULED SALAH"
        $addrFrPatterns = [
            '/Adresse\s*[:\.]?\s*([A-Z0-9ÉÈÊÀÙÎÔ][A-Za-z0-9ÉÈÊÀÙÎÔéèêàùîô\s\-\,\.]+)/i',
        ];
        foreach ($addrFrPatterns as $pat) {
            if (preg_match($pat, $textNorm, $m)) {
                $result['address_fr'] = trim(preg_replace('/\s+/', ' ', $m[1])); break;
            }
        }
        // Address AR: "العنوان دوار أولاد صالح"
        if (preg_match('/العنوان\s*[:\.]?\s*([\x{0600}-\x{06FF}\s0-9\-\,\.]+)/u', $textNorm, $m)) {
            $result['address_ar'] = trim(preg_replace('/\s+/', ' ', $m[1]));
        }

        return $result;
    }


    // ══════════════════════════════════════════════════════════════════════
    // SHARED EXTRACTION HELPERS
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Extract French name from labeled "Nom" or "Nom et Prénom" fields.
     * Returns ['last_name_fr', 'first_name_fr'] partial array.
     */
    private function extractFrenchName(string $text): array
    {
        $last = '';
        $first = '';

        // Baccalauréat Certificate label: "Que le(a) candidat(e) : ENMILI FATIMA-ZAHRA"
        if (preg_match('/(?:Que\s+le\(a\)\s+candidat\(e\)|candidat\(e\))\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-ZÉÈÊÀÙÎÔ\-\s]{2,60}?)(?=\s{2,}|\t|\n|\r|Num[eé]ro|Carte|CNE|CIN|Code|N[°o]|$)/u', $text, $m)) {
            $fullName = trim(preg_replace('/\s+/', ' ', $m[1]));
            $fullName = preg_replace('/\s+[A-Z]{1,2}\d{5,8}.*$/i', '', $fullName);
            $parts = preg_split('/\s+/', $fullName, 2);
            $last  = $parts[0] ?? '';
            $first = $parts[1] ?? '';

        // Combined label: "Nom et Prénom: ENMILI FATIMA-ZAHRA"
        } elseif (preg_match('/Nom\s+et\s+Pr[eé]nom\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-ZÉÈÊÀÙÎÔ\-\s]{2,60}?)(?=\s{2,}|\t|\n|\r|CNE|CIN|Code|N[°o]|$)/u', $text, $m)) {
            $fullName = trim(preg_replace('/\s+/', ' ', $m[1]));
            $fullName = preg_replace('/\s+[A-Z]{1,2}\d{5,8}.*$/i', '', $fullName);
            $parts = preg_split('/\s+/', $fullName, 2);
            $last  = $parts[0] ?? '';
            $first = $parts[1] ?? '';

        // Separate labels: "Nom: ENMILI  Prénom: FATIMA-ZAHRA"
        } elseif (preg_match('/\bNom\b\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-ZÉÈÊÀÙÎÔ\-\s]{1,40}?)(?=\s{2,}|\t|Pr[eé]nom|\n|\r|$)/iu', $text, $m)) {
            $last = trim($m[1]);
            if (preg_match('/Pr[eé]nom\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-ZÉÈÊÀÙÎÔ\-\s]{1,40}?)(?=\s{2,}|\t|\n|\r|$)/iu', $text, $m2)) {
                $first = trim($m2[1]);
            }
        }

        return ['last_name_fr' => $last, 'first_name_fr' => $first];
    }

    /**
     * Extract Arabic candidate name.
     *
     * Strategy (ordered by confidence):
     *  1. Labeled BAC pattern:  "أن المترشح(ة) : النميلي فاطمة الزهراء"
     *  2. Labeled RELEVE pattern: "الاسم العائلي : النميلي"  +  "الاسم الشخصي : فاطمة"
     *  3. Pattern after "الاسم" or "اللقب" anchor
     *  4. Line containing the transliterated French name (cross-language anchor)
     *  5. GIVE UP — return empty strings (never guess random words)
     *
     * Returns ['last_name_ar', 'first_name_ar'] partial array.
     */
    private function extractArabicName(string $text): array
    {
        $arWord = '[\x{0600}-\x{06FF}]+';

        // ── Strategy 1: BAC certificate labeled line
        // "أن المترشح(ة) : النميلي فاطمة الزهراء" or "أن المترشحة :"
        if (preg_match('/(?:أن\s+)?المترشح(?:ة|\(ة\))?\s*[:\-]?\s*(' . $arWord . '(?:\s+' . $arWord . '){0,3})/u', $text, $m)) {
            $tokens = $this->filterArabicTokens(preg_split('/\s+/u', trim($m[1])));
            if (count($tokens) >= 1) {
                return [
                    'last_name_ar'  => $tokens[0],
                    'first_name_ar' => isset($tokens[1]) ? implode(' ', array_slice($tokens, 1, 2)) : '',
                ];
            }
        }

        // ── Strategy 2: Relevé labeled fields
        // "الاسم العائلي : النميلي"  and  "الاسم الشخصي : فاطمة الزهراء"
        $lastName  = '';
        $firstName = '';
        if (preg_match('/(?:الاسم\s+العائلي|اللقب)\s*[:\-]?\s*(' . $arWord . '(?:\s+' . $arWord . ')?)/u', $text, $m)) {
            $t = $this->filterArabicTokens([$m[1]]);
            $lastName = $t[0] ?? '';
        }
        if (preg_match('/(?:الاسم\s+الشخصي|الاسم\s+الأول)\s*[:\-]?\s*(' . $arWord . '(?:\s+' . $arWord . '){0,2})/u', $text, $m)) {
            $ts = $this->filterArabicTokens(preg_split('/\s+/u', trim($m[1])));
            $firstName = implode(' ', $ts);
        }
        if ($lastName) {
            return ['last_name_ar' => $lastName, 'first_name_ar' => $firstName];
        }

        // ── Strategy 3: Line anchored by French name presence
        // Find the Arabic line that sits on the same line / adjacent to the French name
        $lines = preg_split('/[\r\n]+/', $text);
        foreach ($lines as $i => $line) {
            // Look for a line that has ONLY Arabic (2–4 words) — candidate name line
            if (preg_match('/^\s*(' . $arWord . ')(?:\s+(' . $arWord . '))?(?:\s+(' . $arWord . '))?\s*$/u', trim($line), $m)) {
                $candidate = array_filter(array_slice($m, 1), fn($w) => $w !== '');
                $candidate = $this->filterArabicTokens(array_values($candidate));
                // Make sure at least one word is >= 3 chars (avoid noise like "اب", "هم")
                $valid = array_filter($candidate, fn($w) => mb_strlen($w, 'UTF-8') >= 3);
                if (count($valid) >= 1 && count($candidate) <= 4) {
                    return [
                        'last_name_ar'  => $candidate[0],
                        'first_name_ar' => isset($candidate[1]) ? implode(' ', array_slice($candidate, 1, 2)) : '',
                    ];
                }
            }
        }

        // ── Strategy 4: CNIE specific — look for name between "الاسم" and "تاريخ"
        if (preg_match('/(?:الاسم|الإسم)\s+(' . $arWord . '(?:\s+' . $arWord . ')*?)\s+(?:تاريخ|مزداد)/u', $text, $m)) {
            $tokens = $this->filterArabicTokens(preg_split('/\s+/u', trim($m[1])));
            if (count($tokens) >= 1) {
                return [
                    'last_name_ar'  => $tokens[0],
                    'first_name_ar' => isset($tokens[1]) ? implode(' ', array_slice($tokens, 1, 2)) : '',
                ];
            }
        }

        // ── Give up: never return random words
        return ['last_name_ar' => '', 'first_name_ar' => ''];
    }

    /**
     * Filter a list of Arabic word strings against stop-words and minimum length.
     * Only keeps words of >= 3 characters that are not in the stop-word list.
     */
    private function filterArabicTokens(array $words): array
    {
        $result = [];
        foreach ($words as $w) {
            $w = trim((string)$w);
            if ($w === '') continue;
            if (mb_strlen($w, 'UTF-8') < 3) continue;
            if (in_array($w, $this->arabicStopWords, true)) continue;
            $result[] = $w;
        }
        return $result;
    }

    /**
     * Get Arabic word tokens filtered for stop-words & minimum length.
     * @deprecated Use extractArabicName() with context-anchored strategies instead.
     */
    private function getCleanArabicTokens(string $text): array
    {
        $tokens = [];
        if (preg_match_all('/[\x{0600}-\x{06FF}]{3,}/u', $text, $m)) {
            foreach ($m[0] as $w) {
                $w = trim($w);
                if (!in_array($w, $this->arabicStopWords, true) && mb_strlen($w, 'UTF-8') >= 3) {
                    $tokens[] = $w;
                }
            }
        }
        return array_values(array_unique($tokens));
    }


    /**
     * Extract Bac Type / Filière.
     */
    private function extractBacType(string $text): string
    {
        $patterns = [
            '/Sciences\s+Economiques\s+et\s+de\s+Gestion/iu' => 'Sciences Économiques et de Gestion',
            '/Sciences\s+Économiques\s+et\s+de\s+Gestion/iu' => 'Sciences Économiques et de Gestion',
            '/Sciences\s+Économiques/iu'                    => 'Sciences Économiques',
            '/Sciences\s+Economiques/iu'                    => 'Sciences Économiques',
            '/Sciences\s+Mathématiques\s*[AB]/iu'           => 'Sciences Mathématiques',
            '/Sciences\s+Mathematiques\s*[AB]/iu'           => 'Sciences Mathématiques',
            '/Sciences\s+Physiques\s+(?:et\s+Chimie)?/iu'  => 'Sciences Physiques',
            '/Sciences\s+de\s+la\s+Vie\s+et\s+de\s+la\s+Terre/iu' => 'Sciences de la Vie et de la Terre',
            '/مسلك\s+العلوم\s+الاقتصادية/u'                  => 'Sciences Économiques',
            '/مسلك\s+علوم\s+الحياة\s+والأرض/u'              => 'Sciences de la Vie et de la Terre',
            '/مسلك\s+العلوم\s+الفيزيائية/u'                  => 'Sciences Physiques',
            '/مسلك\s+العلوم\s+الرياضيات/u'                   => 'Sciences Mathématiques',
            '/\bSVT\b/'                                     => 'Sciences de la Vie et de la Terre',
            '/\bPCi?\b|\bSPC\b/'                            => 'Sciences Physiques',
            '/\bSMA\b|\bSMB\b|\bSM\b/'                     => 'Sciences Mathématiques',
            '/\bSGC\b/'                                     => 'Sciences de Gestion Comptable',
            '/\bSE\b/'                                      => 'Sciences Économiques',
            '/\bSP\b/'                                      => 'Sciences Physiques',
            '/Lettres\s+(?:et\s+)?(?:Sciences\s+Humaines)?/iu' => 'Lettres et Sciences Humaines',
            '/\bBAC\s+PRO\b/i'                              => 'Baccalauréat Professionnel',
        ];

        foreach ($patterns as $pattern => $label) {
            if (preg_match($pattern, $text)) {
                return $label;
            }
        }

        return '';
    }

    /**
     * Extract Bac Mention.
     */
    private function extractBacMention(string $text): string
    {
        if (preg_match('/(?:MENTION|ADMIS[^\n]*MENTION)\s+(TRÈS\s+BIEN|TRES\s+BIEN|BIEN|ASSEZ\s+BIEN|PASSABLE)/iu', $text, $m)) {
            return mb_strtoupper(trim($m[1]));
        }
        if (preg_match('/(Très\s+Bien|Tres\s+Bien|Bien|Assez\s+Bien|Passable)/iu', $text, $m)) {
            return mb_strtoupper(trim($m[1]));
        }
        return '';
    }

    /**
     * Extract Lycée / High School name.
     */
    private function extractHighSchool(string $text): string
    {
        if (preg_match('/(?:Etablissement|Lycée\s+(?:Qualifiant)?|Lycee\s+(?:Qualifiant)?)\s*[:\-]?\s*([A-ZÉÈÊÀÙÎÔ][A-Za-zÉÈÊÀÙÎÔéèêàùîô\s\'\-]+?)(?=\n|\r|$|Niveau|Deuxième|Direction)/iu', $text, $m)) {
            return trim(preg_replace('/\s+/', ' ', $m[1]));
        }
        return '';
    }

    // ══════════════════════════════════════════════════════════════════════
    // OCR ENGINES
    // ══════════════════════════════════════════════════════════════════════

    private function extractText(string $filePath, string $mimeType, string $docType = 'bac'): string
    {
        $isCnie = in_array($docType, ['cnie', 'cin'], true);

        // ── TIER 1 : pdftotext (Poppler) for digital PDFs
        // SKIP for CNIE — ID cards are image-based; pdftotext returns garbled encoding artifacts
        if (!$isCnie && $this->isPdf($mimeType, $filePath)) {
            $text = $this->runPdfToText($filePath);
            // Validate that pdftotext returned real human-readable text
            // (at least 50 chars and contains at least some Latin/Arabic letters, not just symbols)
            if (strlen(trim($text)) > 50 && preg_match('/[A-Za-z\x{0600}-\x{06FF}]/u', $text)) {
                Log::info('[LocalOCR] Tier 1 (pdftotext) success: ' . strlen($text) . ' chars');
                return $text;
            }
        }

        // ── TIER 2 : Tesseract OCR (always used for CNIE, fallback for others)
        $ocrText = $this->runTesseract($filePath, $mimeType);
        if (strlen(trim($ocrText)) > 20) {
            Log::info('[LocalOCR] Tier 2 (Tesseract) success: ' . strlen($ocrText) . ' chars, docType=' . $docType);
            return $ocrText;
        }

        // ── TIER 3 : PDF binary stream regex fallback
        if ($this->isPdf($mimeType, $filePath)) {
            $binText = $this->extractPdfBinaryText($filePath);
            Log::info('[LocalOCR] Tier 3 (binary) extracted: ' . strlen($binText) . ' chars');
            return $binText;
        }

        return '';
    }

    private function runPdfToText(string $filePath): string
    {
        $output = [];
        $cmd = 'pdftotext -layout -enc UTF-8 ' . escapeshellarg($filePath) . ' - 2>/dev/null';
        @exec($cmd, $output, $code);
        return implode("\n", $output);
    }

    private function runTesseract(string $filePath, string $mimeType): string
    {
        $tmpDir = sys_get_temp_dir();
        $allText = '';

        try {
            $images = [];

            if ($this->isPdf($mimeType, $filePath)) {
                $tmpPrefix = $tmpDir . '/pdf_pg_' . uniqid();
                // Render ALL pages of the PDF as lossless PNG at 300 DPI (Recto & Verso)
                @exec('pdftoppm -png -r 300 ' . escapeshellarg($filePath) . ' ' . escapeshellarg($tmpPrefix) . ' 2>/dev/null');
                $images = glob("{$tmpPrefix}*.png") ?: [];
            } else {
                $tmpImg = $tmpDir . '/ocr_img_' . uniqid() . '.png';
                @copy($filePath, $tmpImg);
                if (file_exists($tmpImg)) $images[] = $tmpImg;
            }

            if (empty($images)) return '';

            foreach ($images as $img) {
                // Preprocess image with ImageMagick (contrast boost, grayscale, deskew, noise removal)
                $enhancedImg = $this->preprocessImage($img);
                $imgList = array_unique([$img, $enhancedImg]);

                foreach ($imgList as $curImg) {
                    // Pass 1: Latin text pass (French + English) — PSM 6 (uniform block)
                    $tmpOut1 = $tmpDir . '/ocr_fr6_' . uniqid();
                    @exec('tesseract ' . escapeshellarg($curImg) . ' ' . escapeshellarg($tmpOut1) . ' -l fra+eng --psm 6 2>/dev/null');
                    $txtFr6 = file_exists("{$tmpOut1}.txt") ? (file_get_contents("{$tmpOut1}.txt") ?: '') : '';
                    if (file_exists("{$tmpOut1}.txt")) @unlink("{$tmpOut1}.txt");

                    // Pass 2: Latin text pass (French + English) — PSM 11 (sparse text for ID cards)
                    $tmpOut2 = $tmpDir . '/ocr_fr11_' . uniqid();
                    @exec('tesseract ' . escapeshellarg($curImg) . ' ' . escapeshellarg($tmpOut2) . ' -l fra+eng --psm 11 2>/dev/null');
                    $txtFr11 = file_exists("{$tmpOut2}.txt") ? (file_get_contents("{$tmpOut2}.txt") ?: '') : '';
                    if (file_exists("{$tmpOut2}.txt")) @unlink("{$tmpOut2}.txt");

                    // Pass 3: Dedicated Arabic text pass — PSM 6
                    $tmpOut3 = $tmpDir . '/ocr_ar6_' . uniqid();
                    @exec('tesseract ' . escapeshellarg($curImg) . ' ' . escapeshellarg($tmpOut3) . ' -l ara --psm 6 2>/dev/null');
                    $txtAr6 = file_exists("{$tmpOut3}.txt") ? (file_get_contents("{$tmpOut3}.txt") ?: '') : '';
                    if (file_exists("{$tmpOut3}.txt")) @unlink("{$tmpOut3}.txt");

                    // Pass 4: Dedicated Arabic text pass — PSM 11 (sparse text)
                    $tmpOut4 = $tmpDir . '/ocr_ar11_' . uniqid();
                    @exec('tesseract ' . escapeshellarg($curImg) . ' ' . escapeshellarg($tmpOut4) . ' -l ara --psm 11 2>/dev/null');
                    $txtAr11 = file_exists("{$tmpOut4}.txt") ? (file_get_contents("{$tmpOut4}.txt") ?: '') : '';
                    if (file_exists("{$tmpOut4}.txt")) @unlink("{$tmpOut4}.txt");

                    $allText .= "\n" . $txtFr6 . "\n" . $txtFr11 . "\n" . $txtAr6 . "\n" . $txtAr11;
                }

                @unlink($img);
                if (file_exists($enhancedImg)) @unlink($enhancedImg);
            }

            return $allText;

        } finally {
            foreach (glob(sys_get_temp_dir() . '/pdf_pg_*.png') as $pg) { @unlink($pg); }
            foreach (glob(sys_get_temp_dir() . '/ocr_img_*.png') as $pg) { @unlink($pg); }
        }
    }

    /**
     * ImageMagick Preprocessing Pipeline (Grayscale, Deskew, Contrast Stretch, Noise Removal, Sharpening).
     */
    private function preprocessImage(string $imgPath): string
    {
        $enhancedPath = preg_replace('/\.png$/i', '_enhanced.png', $imgPath);
        $cmd = 'convert ' . escapeshellarg($imgPath) .
               ' -colorspace Gray -deskew 40% -contrast-stretch 1%x98% -despeckle -unsharp 0x1 ' .
               escapeshellarg($enhancedPath) . ' 2>/dev/null';
        @exec($cmd, $out, $ret);

        return (file_exists($enhancedPath) && filesize($enhancedPath) > 100) ? $enhancedPath : $imgPath;
    }

    private function extractPdfBinaryText(string $filePath): string
    {
        $raw  = @file_get_contents($filePath) ?: '';
        $text = '';

        if (preg_match_all('/\((.*?)\)\s*T[jJ]/s', $raw, $m)) {
            $text .= implode(' ', $m[1]) . "\n";
        }

        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $raw, $streams)) {
            foreach ($streams[1] as $st) {
                $dec = @gzuncompress($st) ?: @gzinflate($st);
                if ($dec && preg_match_all('/\((.*?)\)\s*T[jJ]/s', $dec, $m2)) {
                    $text .= implode(' ', $m2[1]) . "\n";
                }
            }
        }

        return $text;
    }

    // ══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════

    private function isPdf(string $mimeType, string $filePath): bool
    {
        if (str_contains(strtolower($mimeType), 'pdf')) return true;
        $raw = @file_get_contents($filePath, false, null, 0, 4);
        return str_starts_with((string)$raw, '%PDF');
    }

    private function emptyResult(): array
    {
        return [
            'first_name_fr'  => '',
            'last_name_fr'   => '',
            'first_name_ar'  => '',
            'last_name_ar'   => '',
            'cne'            => '',
            'cin'            => '',
            'birth_date'     => '',
            'birth_city_fr'  => '',
            'birth_city_ar'  => '',
            'father_name_fr' => '',
            'father_name_ar' => '',
            'mother_name_fr' => '',
            'mother_name_ar' => '',
            'address_fr'     => '',
            'address_ar'     => '',
            'bac_average'    => '',
            'bac_mention'    => '',
            'bac_type'       => '',
            'high_school'    => '',
        ];
    }
}
