<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiApiService
{
    protected string $geminiApiKey;
    protected string $groqApiKey;
    protected string $geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    protected string $geminiModel = 'gemini-1.5-flash';
    public ?string $lastError = null;

    public function getLastError(): ?string
    {
        return $this->lastError;
    }

    public function __construct()
    {
        $this->geminiApiKey = env('GEMINI_API_KEY', 'AQ.Ab8RN6JF3kpfjK3iYN-JQyQckhl2P91JaiKdX-NczeilSYTA7A');
        // Updated Groq key - 2026-08-02 v2
        $this->groqApiKey = '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';
        Log::info('[GeminiApiService] Groq key prefix: ' . substr($this->groqApiKey, 0, 20));
    }

    /**
     * Send a text prompt to Gemini 1.5 Flash with automatic failover to Groq.
     */
    public function generateContent(string $prompt, array $systemInstructions = []): ?string
    {
        if (!empty($this->geminiApiKey)) {
            $res = $this->callGeminiApi($prompt, $systemInstructions);
            if (!empty($res)) return $res;
        }

        if (!empty($this->groqApiKey)) {
            $res = $this->callGroqApi($prompt, $systemInstructions);
            if (!empty($res)) return $res;
        }

        Log::error('AI Engine Exception: Both Gemini and Groq API calls failed.');
        return null;
    }

    protected function callGeminiApi(string $prompt, array $systemInstructions = []): ?string
    {
        $url = "{$this->geminiBaseUrl}/gemini-flash-latest:generateContent";

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 2048,
            ]
        ];

        if (!empty($systemInstructions)) {
            $payload['systemInstruction'] = [
                'parts' => array_map(fn($ins) => ['text' => $ins], $systemInstructions)
            ];
        }

        try {
            $response = Http::withoutVerifying()->timeout(15)->withHeaders([
                'X-goog-api-key' => $this->geminiApiKey
            ])->post($url, $payload);
            if ($response->successful()) {
                $text = $response->json('candidates.0.content.parts.0.text');
                if (!empty($text)) return trim($text);
            }
            Log::warning('Gemini API Non-200 Response: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::warning('Gemini API Exception: ' . $e->getMessage());
            return null;
        }
    }

    protected function callGroqApi(string $prompt, array $systemInstructions = []): ?string
    {
        $messages = [];
        if (!empty($systemInstructions)) {
            $messages[] = ['role' => 'system', 'content' => implode("\n", $systemInstructions)];
        }
        $messages[] = ['role' => 'user', 'content' => $prompt];

        try {
            $response = Http::withoutVerifying()->timeout(15)->withHeaders([
                'Authorization' => 'Bearer ' . $this->groqApiKey,
                'Content-Type'  => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.3-70b-versatile',
                'messages' => $messages,
                'temperature' => 0.7,
            ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                if (!empty($text)) return trim($text);
            }
            Log::warning('Groq API Non-200 Response: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::warning('Groq API Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Primary Multimodal Document OCR Pipeline
     * July 31, 2026 Original Working Architecture with Multi-Tier Reliability
     */
    public function extractDocumentOcr(string $filePath, string $mimeType, ?string $originalName = null, string $docType = 'bac'): ?array
    {
        if (function_exists('opcache_invalidate')) {
            @opcache_invalidate(__FILE__, true);
            @opcache_invalidate(app_path('Services/AI/LocalOcrService.php'), true);
        }

        if (!file_exists($filePath)) {
            Log::error("OCR File Not Found: {$filePath}");
            return null;
        }
        
        if (empty($mimeType) || $mimeType === 'application/octet-stream') {
            $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mimeType = match($ext) {
                'pdf' => 'application/pdf',
                'png' => 'image/png',
                'webp' => 'image/webp',
                default => 'image/jpeg',
            };
        }

        $promptText = match(strtolower($docType)) {
            'cin', 'cnie' => 'Analyze ALL PAGES of this Moroccan National Identity Card (CNIE) containing BOTH RECTO (front: candidate identity, CIN, birth date, birth city) and VERSO (back: father name, mother name, and current home address in French & Arabic). CRITICAL: You MUST extract parents names (father_name_fr, father_name_ar, mother_name_fr, mother_name_ar) and current residential address (address_fr, address_ar) printed on the VERSO. Output strictly raw JSON with keys: cin, first_name_fr, last_name_fr, first_name_ar (in Arabic script), last_name_ar (in Arabic script), birth_date (YYYY-MM-DD), birth_city_fr, birth_city_ar (in Arabic script), father_name_fr, father_name_ar (in Arabic script), mother_name_fr, mother_name_ar (in Arabic script), address_fr, address_ar (in Arabic script).',
            'releve', 'notes', 'releve_notes' => 'Analyze this Moroccan Baccalaureate Transcript (Relevé de Notes). CRITICAL: The CNE / Code Massar is formatted as 1 letter + 8-9 digits (e.g. H148073298, N142088916). MUST put it in "cne". MUST extract Arabic names in Arabic script. Extract strictly raw JSON with keys: cne, cin, first_name_fr, last_name_fr, first_name_ar (in Arabic script), last_name_ar (in Arabic script), bac_average, national_note, regional_note, bac_type, high_school, academy, prefecture.',
            default => 'Analyze this Moroccan Baccalaureate Certificate (Attestation de Baccalauréat). CRITICAL: On Moroccan Bac certificates, the CNE / Code Massar (formatted as 1 letter + 8-9 digits like H148073298 or N142088916) is printed under candidate details (often near "Carte Nationale"). MUST put it in "cne". MUST extract Arabic names in Arabic script (e.g. فاطمة الزهراء). Extract strictly raw JSON with keys: cne, cin, first_name_fr, last_name_fr, first_name_ar (in Arabic script), last_name_ar (in Arabic script), bac_type, bac_mention, academy, prefecture, high_school.'
        };

        // ==========================================
        // 100% LOCAL FREE OCR & PDF PARSER (Poppler + Tesseract)
        // ==========================================
        try {
            Log::info("OCR Local Service: Triggering Local OCR & PDF Parser for {$docType}...");
            $localOcr = new \App\Services\AI\LocalOcrService();
            $localData = $localOcr->extractDocumentOcr($filePath, $mimeType, $originalName, $docType);

            Log::info('[GeminiApiService] Local OCR Execution Completed Successfully', $localData);
            $this->lastError = null;
            return $localData;
        } catch (\Throwable $e) {
            Log::error('[GeminiApiService] Local OCR error: ' . $e->getMessage());
        }


        $fileBytes = base64_encode(file_get_contents($filePath));
        $pdfPages = $this->convertPdfToJpeg($filePath);

        // ==========================================
        // TIER 1: GOOGLE GEMINI VISION (Primary Native Multimodal Engine)
        // ==========================================
        $geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];

        if (!empty($this->geminiApiKey)) {
            foreach ($geminiModels as $gModel) {
                try {
                    Log::info("OCR Tier 1: Triggering Gemini Vision ({$gModel}) for {$docType}...");
                    $geminiUrl = "{$this->geminiBaseUrl}/{$gModel}:generateContent?key={$this->geminiApiKey}";

                    $imgData = (!empty($pdfPages) && is_string($pdfPages)) ? $pdfPages : file_get_contents($filePath);
                    $imgMime = (!empty($pdfPages) && is_string($pdfPages)) ? 'image/jpeg' : (str_contains(strtolower($mimeType), 'png') ? 'image/png' : 'image/jpeg');

                    $parts = [
                        ['text' => $promptText . ' Output ONLY valid raw JSON without markdown.'],
                        [
                            'inline_data' => [
                                'mime_type' => $imgMime,
                                'data' => base64_encode($imgData)
                            ]
                        ]
                    ];

                    $resG = Http::withoutVerifying()->timeout(25)->withHeaders([
                        'X-goog-api-key' => $this->geminiApiKey
                    ])->post($geminiUrl, [
                        'contents' => [['parts' => $parts]],
                        'generationConfig' => ['temperature' => 0.1]
                    ]);

                    if ($resG->successful()) {
                        $rawTxt = $resG->json('candidates.0.content.parts.0.text');
                        $decodedG = $this->parseJsonResponse($rawTxt);
                        if ($decodedG && count(array_filter($decodedG, fn($v) => !empty($v) && strtolower((string)$v) !== 'inconnu')) > 0) {
                            Log::info("OCR Tier 1 Success via Gemini Vision ({$gModel})!", $decodedG);
                            $this->lastError = null;
                            return $this->cleanAndNormalizeOcrData($decodedG);
                        }
                    } else {
                        $errBody = substr($resG->body(), 0, 250);
                        $this->lastError = "Gemini Vision ({$gModel}) HTTP " . $resG->status() . ": " . $errBody;
                        Log::warning("OCR Tier 1 Gemini ({$gModel}) HTTP " . $resG->status() . ": " . $errBody);
                    }
                } catch (\Throwable $ex) {
                    $this->lastError = "Gemini Vision Exception ({$gModel}): " . $ex->getMessage();
                }
            }
        }

        // ==========================================
        // TIER 1.5: GROQ VISION FAILOVER (llama-3.2-90b-vision-preview / llama-3.2-11b-vision-preview)
        // ==========================================
        if (!empty($this->groqApiKey)) {
            $isImageFile = str_contains(strtolower($mimeType), 'image');
            $imageMime = str_contains(strtolower($mimeType), 'png') ? 'image/png' : (str_contains(strtolower($mimeType), 'webp') ? 'image/webp' : 'image/jpeg');
            
            $userContent = [
                [
                    'type' => 'text',
                    'text' => $promptText . ' IMPORTANT: Extract both French and Arabic text accurately from RECTO and VERSO. Output ONLY valid raw JSON.'
                ]
            ];

            if (!empty($pdfPages) && is_string($pdfPages)) {
                $userContent[] = [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => "data:image/jpeg;base64," . base64_encode($pdfPages)
                    ]
                ];
            } else if ($isImageFile) {
                $userContent[] = [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => "data:{$imageMime};base64,{$fileBytes}"
                    ]
                ];
            }

            if (count($userContent) > 1) {
                $visionModels = ['llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview', 'llama-3.3-70b-versatile'];

                foreach ($visionModels as $modelName) {
                    try {
                        Log::info("OCR Tier 1.5: Triggering Groq Vision ({$modelName}) for {$docType}...");
                        
                        $gRes = Http::withoutVerifying()->timeout(25)->withHeaders([
                            'Authorization' => 'Bearer ' . $this->groqApiKey,
                            'Content-Type'  => 'application/json',
                        ])->post('https://api.groq.com/openai/v1/chat/completions', [
                            'model' => $modelName,
                            'messages' => [
                                [
                                    'role' => 'user',
                                    'content' => $userContent
                                ]
                            ],
                            'temperature' => 0.1
                        ]);

                        if ($gRes->successful()) {
                            $rawJson = $gRes->json('choices.0.message.content');
                            $decodedG = $this->parseJsonResponse($rawJson);
                            if ($decodedG && count(array_filter($decodedG, fn($v) => !empty($v) && strtolower((string)$v) !== 'inconnu')) > 0) {
                                Log::info("OCR Tier 1.5 Success via Groq Vision ({$modelName})!", $decodedG);
                                $this->lastError = null;
                                return $this->cleanAndNormalizeOcrData($decodedG);
                            }
                        } else {
                            $errBody = substr($gRes->body(), 0, 250);
                            $this->lastError = "Groq Vision ({$modelName}) HTTP " . $gRes->status() . ": " . $errBody;
                            Log::warning("OCR Tier 1.5 Groq Vision ({$modelName}) HTTP " . $gRes->status() . ": " . $errBody);
                        }
                    } catch (\Throwable $ex) {
                        $this->lastError = "Groq Vision Exception ({$modelName}): " . $ex->getMessage();
                        Log::error("OCR Tier 1.5 Groq Vision Exception ({$modelName}): " . $ex->getMessage());
                    }
                }
            }
        }

        // ==========================================
        // TIER 2: GROQ LLAMA 3.3 70B DIGITAL TEXT LLM ENGINE
        // ==========================================
        $raw = @file_get_contents($filePath) ?: '';
        $extractedText = '';

        if (preg_match_all('/\((.*?)\)\s*T[jJ]/s', $raw, $mText)) {
            $extractedText .= implode(' ', $mText[1]) . "\n";
        }
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $raw, $streams)) {
            foreach ($streams[1] as $st) {
                $dec = @gzuncompress($st) ?: @gzinflate($st);
                if ($dec && preg_match_all('/\((.*?)\)\s*T[jJ]/s', $dec, $m2)) {
                    $extractedText .= implode(' ', $m2[1]) . "\n";
                }
            }
        }

        if (strlen(trim($extractedText)) < 15) {
            // Extract clean ASCII and Arabic strings safely from binary stream
            if (preg_match_all('/[a-zA-Z0-9\x{0600}-\x{06FF}\s\.\,\:\-\/]{3,}/u', $raw, $mStrings)) {
                $cleanItems = array_filter(array_map('trim', $mStrings[0]), fn($s) => strlen($s) >= 3 && !preg_match('/^(stream|endstream|obj|endobj|xref|trailer|startxref)$/i', $s));
                $extractedText .= implode("\n", array_slice(array_unique($cleanItems), 0, 200)) . "\n";
            }
        }

        if (strlen(trim($extractedText)) > 5 && !empty($this->groqApiKey)) {
            $docContent = "Contenu textuel du document :\n" . $extractedText;

            try {
                Log::info("OCR Tier 2: Triggering Groq Llama-3.3-70b Text LLM for {$docType}...");
                $gResText = Http::withoutVerifying()->timeout(15)->withHeaders([
                    'Authorization' => 'Bearer ' . $this->groqApiKey,
                    'Content-Type'  => 'application/json',
                ])->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Vous êtes un assistant OCR certifié. Extraire exactement les données. ' . $promptText
                        ],
                        [
                            'role' => 'user',
                            'content' => $docContent
                        ]
                    ],
                    'temperature' => 0.1,
                    'response_format' => ['type' => 'json_object']
                ]);

                if ($gResText->successful()) {
                    $rawJson = $gResText->json('choices.0.message.content');
                    $decodedG = $this->parseJsonResponse($rawJson);
                    if ($decodedG && count(array_filter($decodedG, fn($v) => !empty($v) && strtolower((string)$v) !== 'inconnu')) > 0) {
                        Log::info('OCR Tier 2 Success via Groq Llama-3.3-70b Text LLM!', $decodedG);
                        $this->lastError = null;
                        return $this->cleanAndNormalizeOcrData($decodedG);
                    }
                } else {
                    $errBody = substr($gResText->body(), 0, 250);
                    $this->lastError = "Groq Text (llama-3.3-70b) HTTP " . $gResText->status() . ": " . $errBody;
                }
            } catch (\Throwable $ex) {
                $this->lastError = "Groq Text Exception: " . $ex->getMessage();
            }
        }

        // ==========================================
        // TIER 3: LOCAL DETERMINISTIC STREAM & REGEX FALLBACK
        // ==========================================
        Log::info("OCR Tier 3: Executing Local Extraction Fallback for {$docType}...");

        $targetName = $originalName ?: basename($filePath);
        $fullText = $targetName . "\n" . ($extractedText ?: '') . "\n" . $raw;

        $cne = null;
        if (preg_match('/(?:Massar|CNE|Code)\s*[:\.]?\s*([A-Za-z]\d{8,9}|\d{10})/i', $fullText, $mCne1)) {
            $cne = strtoupper($mCne1[1]);
        } elseif (preg_match('/([A-Za-z]\d{8,9})/', $fullText, $mCne2)) {
            $cne = strtoupper($mCne2[1]);
        }

        $cin = null;
        if (preg_match_all('/([A-Za-z]{1,2}\d{5,7})/', $fullText, $mCins)) {
            foreach ($mCins[1] as $cCand) {
                $cCand = strtoupper($cCand);
                if ($cne && str_starts_with($cne, $cCand)) continue;
                $cin = $cCand;
                break;
            }
        }

        $lastNameFr = '';
        if (preg_match('/(?:Nom|Nom\s*de\s*famille)\s*[:\.]?\s*([A-Za-z\s\-]{2,30})/i', $fullText, $mLast)) {
            $lastNameFr = trim($mLast[1]);
        }

        $firstNameFr = '';
        if (preg_match('/(?:Prénom|Prénoms)\s*[:\.]?\s*([A-Za-z\s\-]{2,30})/i', $fullText, $mFirst)) {
            $firstNameFr = trim($mFirst[1]);
        }

        $birthDate = '';
        if (preg_match('/(?:Né\(e\)\s*le|Date\s*de\s*naissance)\s*[:\.]?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4}|\d{4}[\/\.-]\d{2}[\/\.-]\d{2})/i', $fullText, $mBirth)) {
            $bRaw = $mBirth[1];
            if (preg_match('/^(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})$/', $bRaw, $mD)) {
                $birthDate = "{$mD[3]}-{$mD[2]}-{$mD[1]}";
            } else {
                $birthDate = $bRaw;
            }
        }

        $bacAvg = null;
        if (preg_match('/(1[0-9]\.[0-9]{1,2}|20\.00)/', $fullText, $mAvg)) {
            $bacAvg = $mAvg[1];
        }

        $bacType = '';
        if (preg_match('/(Sciences\s+Physiques|Sciences\s+Math|Sciences\s+Economiques|STMG|SM|PC|SVT)/i', $fullText, $mBranch)) {
            $bacType = $mBranch[1];
        }

        return $this->cleanAndNormalizeOcrData([
            'first_name_fr' => $firstNameFr,
            'last_name_fr' => $lastNameFr,
            'first_name_ar' => '',
            'last_name_ar' => '',
            'cne' => $cne ?: '',
            'cin' => $cin ?: '',
            'birth_date' => $birthDate,
            'birth_city_fr' => '',
            'birth_city_ar' => '',
            'father_name_fr' => '',
            'father_name_ar' => '',
            'mother_name_fr' => '',
            'mother_name_ar' => '',
            'address_fr' => '',
            'address_ar' => '',
            'bac_average' => $bacAvg ?: '',
            'bac_mention' => '',
            'bac_type' => $bacType ?: '',
            'high_school' => '',
        ]);
    }

    protected function convertPdfToJpeg(string $filePath): ?string
    {
        if (extension_loaded('imagick')) {
            try {
                $imagick = new \Imagick();
                $imagick->setResolution(150, 150);
                $imagick->readImage($filePath);
                $imagick->setImageFormat('jpeg');
                $imagick->setImageCompressionQuality(85);
                
                if ($imagick->getNumberImages() > 1) {
                    $blobs = [];
                    foreach ($imagick as $page) {
                        $blobs[] = $page->getImageBlob();
                    }
                    return $this->combineImagesVertically($blobs);
                }
                return $imagick->getImageBlob();
            } catch (\Throwable $e) {
                Log::warning('Imagick PDF conversion failed: ' . $e->getMessage());
            }
        }

        $tmpOut = sys_get_temp_dir() . '/pdf_pg_' . uniqid();
        @exec("pdftoppm -jpeg -r 150 -f 1 -l 2 " . escapeshellarg($filePath) . " " . escapeshellarg($tmpOut));
        $genFiles = glob("{$tmpOut}*.jpg");
        if (!empty($genFiles)) {
            $blobs = array_map('file_get_contents', $genFiles);
            foreach ($genFiles as $f) { @unlink($f); }
            return $this->combineImagesVertically($blobs);
        }

        return $this->extractPdfPagesAsJpegs($filePath);
    }

    protected function extractPdfPagesAsJpegs(string $filePath): ?string
    {
        $raw = @file_get_contents($filePath) ?: '';
        if (strpos($raw, '%PDF') === false) {
            return null;
        }

        $extractedImages = [];

        // 1. Search for raw JPEG streams (\xFF\xD8\xFF ... \xFF\xD9)
        if (preg_match_all('/\xFF\xD8\xFF.*?\xFF\xD9/s', $raw, $jpgMatches)) {
            foreach ($jpgMatches[0] as $jData) {
                if (strlen($jData) > 1000) {
                    $extractedImages[] = $jData;
                }
            }
        }

        // 2. Search inside decompressed FlateDecode streams
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $raw, $streams)) {
            foreach ($streams[1] as $st) {
                $dec = @gzuncompress($st) ?: @gzinflate($st);
                if ($dec) {
                    if (preg_match_all('/\xFF\xD8\xFF.*?\xFF\xD9/s', $dec, $mDecJpg)) {
                        foreach ($mDecJpg[0] as $jDec) {
                            if (strlen($jDec) > 1000) {
                                $extractedImages[] = $jDec;
                            }
                        }
                    }
                    if (preg_match_all('/\x89PNG\x0D\x0A\x1A\x0A.*?IEND\xAE\x42\x60\x82/s', $dec, $mDecPng)) {
                        foreach ($mDecPng[0] as $pDec) {
                            if (strlen($pDec) > 1000) {
                                $extractedImages[] = $pDec;
                            }
                        }
                    }
                }
            }
        }

        if (count($extractedImages) >= 2) {
            return $this->combineImagesVertically($extractedImages);
        } elseif (!empty($extractedImages)) {
            return $extractedImages[0];
        }

        return null;
    }

    /**
     * Combine multi-page PDF rendered images vertically into 1 unified image for Gemini/Groq Vision.
     */
    protected function combineImagesVertically(array $imageBlobs): ?string
    {
        if (empty($imageBlobs)) return null;
        if (count($imageBlobs) === 1) return $imageBlobs[0];

        if (!function_exists('imagecreatefromstring')) {
            return $imageBlobs[0];
        }

        try {
            $imgs = [];
            $totalH = 0;
            $maxW = 0;
            foreach ($imageBlobs as $blob) {
                $im = @imagecreatefromstring($blob);
                if ($im) {
                    $w = imagesx($im);
                    $h = imagesy($im);
                    $imgs[] = ['im' => $im, 'w' => $w, 'h' => $h];
                    $totalH += $h;
                    if ($w > $maxW) $maxW = $w;
                }
            }

            if (empty($imgs)) return null;

            $scale = $maxW > 1200 ? (1200.0 / $maxW) : 1.0;
            $finalW = (int)round($maxW * $scale);
            $finalH = (int)round($totalH * $scale);

            $canvas = imagecreatetruecolor($finalW, $finalH);
            $bg = imagecolorallocate($canvas, 255, 255, 255);
            imagefill($canvas, 0, 0, $bg);

            $currY = 0;
            foreach ($imgs as $item) {
                $itemW = (int)round($item['w'] * $scale);
                $itemH = (int)round($item['h'] * $scale);
                imagecopyresampled($canvas, $item['im'], 0, $currY, 0, 0, $itemW, $itemH, $item['w'], $item['h']);
                $currY += $itemH;
                imagedestroy($item['im']);
            }

            ob_start();
            imagejpeg($canvas, null, 85);
            $combinedJpeg = ob_get_clean();
            imagedestroy($canvas);

            if (!empty($combinedJpeg)) {
                Log::info("Combined " . count($imageBlobs) . " PDF pages vertically into single {$finalW}x{$finalH} image (" . strlen($combinedJpeg) . " bytes).");
                return $combinedJpeg;
            }
        } catch (\Throwable $e) {
            Log::warning('Image stitch skipped: ' . $e->getMessage());
        }

        return $imageBlobs[0];
    }

    public function cleanAndNormalizeOcrData(array $data): array
    {
        $cneRaw = strtoupper(trim((string)($data['cne'] ?? '')));
        $cinRaw = strtoupper(trim((string)($data['cin'] ?? '')));

        $isCinPattern = fn($val) => preg_match('/^[A-Z]{1,2}\d{5,7}$/', trim($val));
        $isCnePattern = fn($val) => preg_match('/^([A-Z]\d{8,9}|\d{10})$/', trim($val));

        $finalCin = '';
        $finalCne = '';

        if (!empty($cinRaw)) {
            if ($isCinPattern($cinRaw)) {
                $finalCin = $cinRaw;
            } elseif ($isCnePattern($cinRaw)) {
                $finalCne = $cinRaw;
            }
        }

        if (!empty($cneRaw)) {
            if ($isCnePattern($cneRaw)) {
                $finalCne = $cneRaw;
            } elseif ($isCinPattern($cneRaw) && empty($finalCin)) {
                $finalCin = $cneRaw;
            }
        }

        $data['cin'] = $finalCin;
        $data['cne'] = $finalCne;

        if (!empty($data['bac_type']) && $data['bac_type'] !== 'Inconnu') {
            $bt = strtoupper($data['bac_type']);
            if (str_contains($bt, 'ECONOMIQ')) $data['bac_type'] = 'Sciences Économiques';
            elseif (str_contains($bt, 'GESTION')) $data['bac_type'] = 'Sciences de Gestion Comptable';
            elseif (str_contains($bt, 'PHYSIQ')) $data['bac_type'] = 'Sciences Physiques';
            elseif (str_contains($bt, 'SVT') || str_contains($bt, 'VIE') || str_contains($bt, 'TERRE')) $data['bac_type'] = 'Sciences de la Vie et de la Terre';
            elseif (str_contains($bt, 'MATH')) $data['bac_type'] = 'Sciences Mathématiques';
            elseif (str_contains($bt, 'LETTRE') || str_contains($bt, 'HUMAIN')) $data['bac_type'] = 'Lettres et Sciences Humaines';
        }

        if (!empty($data['birth_date']) && $data['birth_date'] !== 'Inconnu') {
            $bd = trim($data['birth_date']);
            if (preg_match('/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/', $bd, $mDate)) {
                $day = str_pad($mDate[1], 2, '0', STR_PAD_LEFT);
                $month = str_pad($mDate[2], 2, '0', STR_PAD_LEFT);
                $year = $mDate[3];
                if ((int)$day > 31 && (int)$month <= 12) {
                    $tmp = $day; $day = $month; $month = substr($tmp, -2);
                }
                $data['birth_date'] = "{$year}-{$month}-{$day}";
            } elseif (preg_match('/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/', $bd, $mDate)) {
                $year = $mDate[1];
                $month = str_pad($mDate[2], 2, '0', STR_PAD_LEFT);
                $day = str_pad($mDate[3], 2, '0', STR_PAD_LEFT);
                $data['birth_date'] = "{$year}-{$month}-{$day}";
            }
        }

        if (!empty($data['bac_average']) && is_numeric($data['bac_average'])) {
            $avg = (float)$data['bac_average'];
            if (empty($data['bac_mention']) || $data['bac_mention'] === 'Inconnu') {
                if ($avg >= 16) $data['bac_mention'] = 'Très Bien';
                elseif ($avg >= 14) $data['bac_mention'] = 'Bien';
                elseif ($avg >= 12) $data['bac_mention'] = 'Assez Bien';
                elseif ($avg >= 10) $data['bac_mention'] = 'Passable';
            }
        }



        foreach ($data as $key => $val) {
            if (is_null($val) || in_array(strtolower(trim((string)$val)), ['inconnu', 'n/a', 'null', 'none', 'undefined', 'aucun'])) {
                $data[$key] = '';
            }
        }

        return $data;
    }

    protected function parseJsonResponse(?string $jsonText): ?array
    {
        if (empty($jsonText)) return null;

        $cleaned = trim($jsonText);
        $cleaned = preg_replace('/^```(?:json)?\s*/i', '', $cleaned);
        $cleaned = preg_replace('/\s*```$/i', '', $cleaned);
        $cleaned = trim($cleaned);

        $decoded = json_decode($cleaned, true);
        if (is_array($decoded)) return $decoded;

        if (preg_match('/\{.*\}/s', $cleaned, $matches)) {
            $decoded = json_decode($matches[0], true);
            if (is_array($decoded)) return $decoded;
        }

        return null;
    }
}
