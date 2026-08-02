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
        $this->geminiApiKey = config('services.gemini.key') ?: env('GEMINI_API_KEY', '');
        $this->groqApiKey = config('services.groq.key') ?: env('GROQ_API_KEY', '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');
    }

    /**
     * Send a prompt to Gemini 1.5 Flash (Primary AI Engine) with automatic failover to Groq (Llama-3.3-70b).
     */
    public function generateContent(string $prompt, array $systemInstructions = []): ?string
    {
        // 1. Try Primary Engine: Google Gemini 1.5 Flash
        if (!empty($this->geminiApiKey)) {
            $geminiResult = $this->callGeminiApi($prompt, $systemInstructions);
            if (!empty($geminiResult)) {
                return $geminiResult;
            }
        }

        // 2. Try Secondary Failover Engine: Groq Llama-3.3-70b
        if (!empty($this->groqApiKey)) {
            $groqResult = $this->callGroqApi($prompt, $systemInstructions);
            if (!empty($groqResult)) {
                return $groqResult;
            }
        }

        Log::error('AI Engine Exception: Both Gemini and Groq API calls failed or returned empty results.');
        return null;
    }

    /**
     * Call Google Gemini API (gemini-1.5-flash / gemini-2.0-flash).
     */
    protected function callGeminiApi(string $prompt, array $systemInstructions = []): ?string
    {
        $url = "{$this->geminiBaseUrl}/{$this->geminiModel}:generateContent?key={$this->geminiApiKey}";

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
                'parts' => array_map(fn($instruction) => ['text' => $instruction], $systemInstructions)
            ];
        }

        try {
            $response = Http::timeout(10)->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if (!empty($text)) {
                    return trim($text);
                }
            }

            Log::warning('Gemini API Non-200 Response: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::warning('Gemini API Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Failover: Call Groq API (llama-3.3-70b-versatile).
     */
    protected function callGroqApi(string $prompt, array $systemInstructions = []): ?string
    {
        $url = 'https://api.groq.com/openai/v1/chat/completions';

        $messages = [];

        if (!empty($systemInstructions)) {
            $messages[] = [
                'role' => 'system',
                'content' => implode("\n", $systemInstructions)
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];

        $payload = [
            'model' => 'llama-3.3-70b-versatile',
            'messages' => $messages,
            'temperature' => 0.7,
            'max_tokens' => 2048,
        ];

        try {
            $response = Http::timeout(10)
                ->withToken($this->groqApiKey)
                ->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['choices'][0]['message']['content'] ?? null;
                if (!empty($text)) {
                    return trim($text);
                }
            }

            Log::warning('Groq API Non-200 Response: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::warning('Groq API Exception: ' . $e->getMessage());
            return null;
        }
    }

    // Module 1: Chatbot Virtuel
    public function chatbotResponse(string $message): string
    {
        $system = [
            "Tu es l'assistant virtuel officiel de l'ENCG Fès (École Nationale de Commerce et de Gestion de Fès).",
            "Réponds de manière concrète, polie et très précise aux étudiants et professeurs.",
            "Aide-les sur les dates d'examens, documents administratifs, absences et stages."
        ];

        return $this->generateContent($message, $system) ?? "Je suis disponible pour vous aider avec les procédures de l'ENCG Fès.";
    }

    // Module 2: QCM Generator (IA)
    public function generateQcm(string $topic, int $questionsCount = 5): string
    {
        $system = [
            "Tu es un professeur titulaire de l'ENCG Fès expert en élaboration d'épreuves d'évaluation.",
            "Génère un QCM de niveau universitaire au format JSON strictement valide sans aucun texte autour ni bloc markdown.",
            "Format attendu: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correct_index\":0}]"
        ];

        $prompt = "Conçois un QCM de $questionsCount questions de niveau universitaire sur le thème : $topic.";

        $result = $this->generateContent($prompt, $system);

        if ($result) {
            $result = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $result);
            $result = preg_replace('/```\s*(.*?)\s*```/s', '$1', $result);
        }

        return $result ?? "[]";
    }

    // Module 3: Résumé de Cours
    public function summarizeText(string $text): string
    {
        $system = [
            "Tu es un professeur agrégé de l'ENCG Fès expert en synthèse académique."
        ];

        $prompt = "Résume le cours suivant en mettant en valeur les concepts clés, formules et définitions fondamentales :\n\n" . $text;
        return $this->generateContent($prompt, $system) ?? "Impossible de résumer ce texte actuellement.";
    }

    // Module 4: Tuteur Virtuel
    public function virtualTutorResponse(string $question, string $contextText): string
    {
        $system = [
            "Tu es un tuteur pédagogique de l'ENCG Fès.",
            "Réponds à l'étudiant en te basant exclusivement sur le cours fourni."
        ];

        $prompt = "Contexte du cours :\n$contextText\n\nQuestion de l'étudiant : $question";
        return $this->generateContent($prompt, $system) ?? "Désolé, je ne peux pas traiter cette demande pour le moment.";
    }

    // Module 5: Planificateur de Révision
    public function generateRevisionPlan(string $modules): string
    {
        $system = [
            "Tu es un coach académique expert pour les étudiants de l'ENCG Fès.",
            "Génère un plan de révision au format JSON strictement valide sans aucun bloc markdown autour.",
            "Format attendu: {\"motivationMessage\":\"...\",\"plan\":[{\"day\":\"Jour 1\",\"focus\":\"...\",\"tasks\":[\"...\"]}],\"tips\":[\"...\"]}"
        ];

        $prompt = "Élabore un programme de révision sur 7 jours pour ces modules : $modules.";

        $result = $this->generateContent($prompt, $system);
        if ($result) {
            $result = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $result);
            $result = preg_replace('/```\s*(.*?)\s*```/s', '$1', $result);
        }
        return $result ?? "{}";
    }

    // Module 6: Rapport Pédagogique Étudiant
    public function generateStudentReport(string $studentData): string
    {
        $system = [
            "Tu es un conseiller pédagogique principal de l'ENCG Fès.",
            "Analyse le profil de l'étudiant et formule un rapport structuré avec conseils personnalisés."
        ];

        $prompt = "Données de l'étudiant :\n" . $studentData;
        return $this->generateContent($prompt, $system) ?? "Rapport non disponible.";
    }

    /**
     * Render PDF pages 1 and 2 (Recto and Verso) as high-resolution JPEG images using pdftoppm.
     */
    protected function extractPdfPagesAsJpegs(string $filePath): array
    {
        $pages = [];

        // 1. Try pdftoppm shell utility first (glob captures all generated pages)
        try {
            $tmpJpegPrefix = sys_get_temp_dir() . '/pdf_ocr_' . uniqid();
            $cmd = "pdftoppm -jpeg -r 150 -f 1 -l 2 " . escapeshellarg($filePath) . " " . escapeshellarg($tmpJpegPrefix) . " 2>&1";
            @exec($cmd, $out, $ret);

            $files = glob($tmpJpegPrefix . '*.jpg') ?: [];
            sort($files);
            foreach ($files as $file) {
                if (file_exists($file) && filesize($file) > 1000) {
                    $pages[] = file_get_contents($file);
                    @unlink($file);
                }
            }
            if (!empty($pages)) {
                Log::info('pdftoppm PDF Pages Conversion Success! Rendered pages: ' . count($pages));
                return $pages;
            }
        } catch (\Throwable $e) {
            Log::warning('pdftoppm multi-page conversion skipped: ' . $e->getMessage());
        }

        // 2. Try Imagick multi-page extraction if available
        if (extension_loaded('imagick') && class_exists('\Imagick')) {
            try {
                $im = new \Imagick();
                $im->setResolution(150, 150);
                $im->readImage($filePath);
                $numPages = min(2, $im->getNumberImages());
                for ($i = 0; $i < $numPages; $i++) {
                    $im->setIteratorIndex($i);
                    $im->setImageFormat('jpeg');
                    $blob = $im->getImageBlob();
                    if (!empty($blob)) {
                        $pages[] = $blob;
                    }
                }
                if (!empty($pages)) {
                    Log::info('Imagick Multi-Page PDF Conversion Success! Pages: ' . count($pages));
                    return $pages;
                }
            } catch (\Throwable $e) {
                Log::warning('Imagick multi-page conversion skipped: ' . $e->getMessage());
            }
        }

        // 3. Fallback: Parse raw PDF JPEG image streams (extract Recto & Verso embedded images)
        $raw = @file_get_contents($filePath) ?: '';
        if (strpos($raw, '%PDF') !== false) {
            if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $raw, $streams)) {
                foreach ($streams[1] as $st) {
                    if (str_starts_with($st, "\xFF\xD8\xFF") && strlen($st) > 2000) {
                        $pages[] = $st;
                    } else {
                        $dec = @gzuncompress($st) ?: @gzinflate($st);
                        if ($dec && str_starts_with($dec, "\xFF\xD8\xFF") && strlen($dec) > 2000) {
                            $pages[] = $dec;
                        }
                    }
                    if (count($pages) >= 2) break;
                }
            }
        }

        return $pages;
    }

    /**
     * Extract raw uncorrupted embedded JPEG photo scan from PDF objects (/DCTDecode or /FlateDecode) or Imagick.
     */
    protected function extractImageFromPdf(string $filePath): ?string
    {
        // 1. Try pdftoppm shell utility first for 100% accurate PDF page rendering
        try {
            $tmpJpegPrefix = sys_get_temp_dir() . '/pdf_ocr_' . uniqid();
            $cmd = "pdftoppm -jpeg -r 150 -f 1 -l 1 " . escapeshellarg($filePath) . " " . escapeshellarg($tmpJpegPrefix) . " 2>&1";
            @exec($cmd, $out, $ret);
            $generatedJpeg = $tmpJpegPrefix . '-1.jpg';
            if (file_exists($generatedJpeg) && filesize($generatedJpeg) > 1000) {
                $jpegData = file_get_contents($generatedJpeg);
                @unlink($generatedJpeg);
                Log::info('pdftoppm PDF Page 1 Conversion Success!');
                return $jpegData;
            }
        } catch (\Throwable $e) {
            Log::warning('pdftoppm conversion skipped: ' . $e->getMessage());
        }

        // 2. Try Imagick extension safely if available
        if (extension_loaded('imagick') && class_exists('\Imagick')) {
            try {
                $im = new \Imagick();
                $im->setResolution(150, 150);
                $im->readImage($filePath);
                $im->setImageFormat('jpeg');
                $blob = $im->getImageBlob();
                if (!empty($blob)) {
                    Log::info('Imagick PDF Page 1 Conversion Success');
                    return $blob;
                }
            } catch (\Throwable $e) {
                Log::warning('Imagick PDF conversion skipped: ' . $e->getMessage());
            }
        }

        $raw = @file_get_contents($filePath) ?: '';
        if (strpos($raw, '%PDF') === false) {
            return null;
        }

        $largest = null;
        $maxLen = 0;

        // 2. Match full JPEG streams bounded by PDF 'stream' and 'endstream' keywords
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $raw, $streams)) {
            foreach ($streams[1] as $st) {
                if (str_starts_with($st, "\xFF\xD8\xFF") && strlen($st) > $maxLen) {
                    $maxLen = strlen($st);
                    $largest = $st;
                }
            }
        }

        if ($largest && $maxLen > 2000) {
            return $largest;
        }

        // 3. Search inside decompressed FlateDecode streams
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $raw, $streams)) {
            foreach ($streams[1] as $st) {
                $dec = @gzuncompress($st) ?: @gzinflate($st);
                if ($dec && str_starts_with($dec, "\xFF\xD8\xFF") && strlen($dec) > $maxLen) {
                    $maxLen = strlen($dec);
                    $largest = $dec;
                }
            }
        }

        if (!$largest) {
            Log::warning('PDF Image Conversion Failed for file: ' . basename($filePath));
        }

        return $largest;
    }

    /**
     * Combine multi-page PDF rendered images vertically into 1 unified image for Groq Vision.
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
                Log::info("Stitched " . count($imageBlobs) . " PDF pages vertically into single {$finalW}x{$finalH} image (" . strlen($combinedJpeg) . " bytes) for Groq Vision.");
                return $combinedJpeg;
            }
        } catch (\Throwable $e) {
            Log::warning('Image stitch skipped: ' . $e->getMessage());
        }

        return $imageBlobs[0];
    }

    /**
     * Downscale and compress large scanned JPG/PNG images to max 1800px width for fast Groq Vision processing.
     */
    protected function resizeImageForOcr(string $filePath): string
    {
        $bytes = @file_get_contents($filePath);
        if (!$bytes || strlen($bytes) < 100) {
            return base64_encode($bytes ?: '');
        }

        if (function_exists('imagecreatefromstring') && strlen($bytes) > 600000) {
            try {
                $img = @imagecreatefromstring($bytes);
                if ($img) {
                    $w = imagesx($img);
                    $h = imagesy($img);
                    if ($w > 1800 || $h > 1800) {
                        $newW = 1800;
                        $newH = (int)round(($h / $w) * 1800);
                        $resized = imagecreatetruecolor($newW, $newH);
                        imagecopyresampled($resized, $img, 0, 0, 0, 0, $newW, $newH, $w, $h);
                        ob_start();
                        imagejpeg($resized, null, 85);
                        $compressed = ob_get_clean();
                        imagedestroy($img);
                        imagedestroy($resized);
                        if (!empty($compressed)) {
                            Log::info("Resized Scanned Image for OCR from {$w}x{$h} to {$newW}x{$newH} (Size: " . strlen($compressed) . " bytes)");
                            return base64_encode($compressed);
                        }
                    }
                    imagedestroy($img);
                }
            } catch (\Throwable $e) {
                Log::warning('Image resize for OCR skipped: ' . $e->getMessage());
            }
        }

        return base64_encode($bytes);
    }

    /**
     * Real-time OCR Document Data Extraction using Groq Llama-3.2 Vision or Google Gemini 1.5 Flash Vision.
     */
    public function extractDocumentOcr(string $filePath, string $mimeType, ?string $originalName = null, string $docType = 'bac'): ?array
    {
        if (!file_exists($filePath)) {
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

        // Dynamic extraction instruction tailored to exact document fields with explicit Arabic & Recto/Verso instructions
        $promptText = match(strtolower($docType)) {
            'cin', 'cnie' => 'Analyze this Moroccan National Identity Card (CNIE) containing RECTO (front: student personal details) and VERSO (back: parents & current address). MUST extract Arabic names in Arabic script (e.g. النميلي, فاطمة الزهراء). Extract strictly raw JSON with keys: cin, first_name_fr, last_name_fr, first_name_ar (in Arabic script), last_name_ar (in Arabic script), birth_date (YYYY-MM-DD), birth_city_fr, birth_city_ar (in Arabic script), father_name_fr, father_name_ar (in Arabic script), mother_name_fr, mother_name_ar (in Arabic script), address_fr, address_ar (in Arabic script).',
            'releve', 'notes', 'releve_notes' => 'Analyze this Moroccan Baccalaureate Transcript (Relevé de Notes). CRITICAL: The CNE / Code Massar is formatted as 1 letter + 8-9 digits (e.g. H148073298, N142088916). MUST put it in "cne". MUST extract Arabic names in Arabic script. Extract strictly raw JSON with keys: cne, cin, first_name_fr, last_name_fr, first_name_ar (in Arabic script), last_name_ar (in Arabic script), bac_average, national_note, regional_note, bac_type, high_school, academy, prefecture.',
            default => 'Analyze this Moroccan Baccalaureate Certificate (Attestation de Baccalauréat). CRITICAL: On Moroccan Bac certificates, the CNE / Code Massar (formatted as 1 letter + 8-9 digits like H148073298 or N142088916) is printed under candidate details (often near "Carte Nationale"). MUST put it in "cne". MUST extract Arabic names in Arabic script (e.g. فاطمة الزهراء). Extract strictly raw JSON with keys: cne, cin, first_name_fr, last_name_fr, first_name_ar (in Arabic script), last_name_ar (in Arabic script), bac_type, bac_mention, academy, prefecture, high_school.'
        };

        // ==========================================
        // TIER 1: GROQ VISION ENGINE (qwen/qwen3.6-27b)
        // ==========================================
        $groqKey = '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';

        $imageMime = str_contains(strtolower($mimeType), 'png') ? 'image/png' : (str_contains(strtolower($mimeType), 'webp') ? 'image/webp' : 'image/jpeg');
        $fileBytes = base64_encode(file_get_contents($filePath));
        $pdfPages = $this->extractPdfPagesAsJpegs($filePath);
        $userContent = [
            [
                'type' => 'text',
                'text' => $promptText . ' IMPORTANT: Extract both French and Arabic text accurately. If document has multiple pages (Recto & Verso), analyze ALL pages. Output ONLY valid raw JSON.'
            ]
        ];

        if (!empty($pdfPages)) {
            $singleBlob = (count($pdfPages) >= 2) ? $this->combineImagesVertically($pdfPages) : $pdfPages[0];
            $userContent[] = [
                'type' => 'image_url',
                'image_url' => [
                    'url' => "data:image/jpeg;base64," . base64_encode($singleBlob ?: $pdfPages[0])
                ]
            ];
        } else {
            $userContent[] = [
                'type' => 'image_url',
                'image_url' => [
                    'url' => "data:{$imageMime};base64,{$fileBytes}"
                ]
            ];
        }

        $visionModels = ['llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview'];

        foreach ($visionModels as $modelName) {
            try {
                Log::info("Triggering Vision Engine: Groq ({$modelName}) for {$docType}...");
                
                $gRes = Http::timeout(25)->withHeaders([
                    'Authorization' => 'Bearer ' . $groqKey,
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
                    $rawJson = trim($gRes->json('choices.0.message.content') ?? '');
                    if (preg_match('/\{.*\}/s', $rawJson, $mJson)) {
                        $decodedG = json_decode($mJson[0], true);
                        if (is_array($decodedG) && count(array_filter($decodedG, fn($v) => !empty($v) && strtolower((string)$v) !== 'inconnu')) > 0) {
                            Log::info("Groq Vision ({$modelName}) OCR Success!", $decodedG);
                            return $this->cleanAndNormalizeOcrData($decodedG);
                        }
                    }
                } else {
                    Log::warning("Groq Vision ({$modelName}) HTTP " . $gRes->status() . ": " . substr($gRes->body(), 0, 200));
                }
            } catch (\Throwable $ex) {
                Log::error("Groq Vision ({$modelName}) Exception: " . $ex->getMessage());
            }
        }

        // ==========================================
        // TIER 2: GROQ TEXT ENGINE (llama-3.3-70b-versatile) - Only for PDFs with digital text
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

        if (strlen(trim($extractedText)) > 20) {
            $docContent = "Contenu textuel du document :\n" . $extractedText;

            try {
                $gResText = Http::timeout(15)->withHeaders([
                    'Authorization' => 'Bearer ' . $groqKey,
                    'Content-Type'  => 'application/json',
                ])->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Vous êtes un assistant OCR certifié. NE JAMAIS inventer de noms ou d\'adresses. Extract exact data. ' . $promptText
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
                    $rawJson = trim($gResText->json('choices.0.message.content') ?? '');
                    $rawJson = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $rawJson);
                    $rawJson = preg_replace('/```\s*(.*?)\s*```/s', '$1', $rawJson);
                    $decodedG = json_decode($rawJson, true);
                    if (is_array($decodedG) && count(array_filter($decodedG, fn($v) => !empty($v) && strtolower((string)$v) !== 'inconnu')) > 0) {
                        Log::info('Groq Llama-3.3-70b Text OCR Success!', $decodedG);
                        return $this->cleanAndNormalizeOcrData($decodedG);
                    }
                }
            } catch (\Throwable $ex) {
                Log::error("Groq Text Exception: " . $ex->getMessage());
            }
        }

        // ==========================================
        // TIER 3: DOCUMENT STREAM PARSER (Pure regex extraction without fake fallback names)
        // ==========================================
        $targetName = $originalName ?: basename($filePath);

        $cne = null;
        if (preg_match('/([A-Za-z]\d{8,9})/', $targetName . ' ' . $raw, $mCne)) {
            $cne = strtoupper($mCne[1]);
        }

        $cin = null;
        if (preg_match_all('/([A-Za-z]{1,2}\d{5,7})/', $targetName . ' ' . $raw, $mCins)) {
            foreach ($mCins[1] as $cCand) {
                $cCand = strtoupper($cCand);
                if ($cne && str_starts_with($cne, $cCand)) {
                    continue;
                }
                $cin = $cCand;
                break;
            }
        }

        $bacAvg = null;
        if (preg_match('/(1[0-9]\.[0-9]{1,2}|20\.00)/', $targetName . ' ' . $raw, $mAvg)) {
            $bacAvg = $mAvg[1];
        }

        $bacType = '';
        if (preg_match('/(Sciences\s+Physiques|Sciences\s+Math|Sciences\s+Economiques|STMG|SM|PC|SVT)/i', $raw, $mBranch)) {
            $bacType = $mBranch[1];
        }

        return $this->cleanAndNormalizeOcrData([
            'first_name_fr' => '',
            'last_name_fr' => '',
            'first_name_ar' => '',
            'last_name_ar' => '',
            'cne' => $cne ?: '',
            'cin' => $cin ?: '',
            'birth_date' => '',
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

    /**
     * Clean, normalize, and disambiguate OCR fields (CNE vs CIN, Date formats, Bac types, Mentions).
     */
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

        // Regex Fallback scan for CNE (Massar format: 1 letter + 8-9 digits e.g. H148073298) across all fields
        if (empty($finalCne)) {
            $allText = json_encode($data);
            if (preg_match('/\b([A-Z]\d{8,9}|\d{10})\b/', $allText, $mCne)) {
                $finalCne = $mCne[1];
            }
        }

        $data['cin'] = $finalCin;
        $data['cne'] = $finalCne;

        // Normalize Bac Type
        if (!empty($data['bac_type']) && $data['bac_type'] !== 'Inconnu') {
            $bt = strtoupper($data['bac_type']);
            if (str_contains($bt, 'ECONOMIQ')) $data['bac_type'] = 'Sciences Économiques';
            elseif (str_contains($bt, 'GESTION')) $data['bac_type'] = 'Sciences de Gestion Comptable';
            elseif (str_contains($bt, 'PHYSIQ')) $data['bac_type'] = 'Sciences Physiques';
            elseif (str_contains($bt, 'SVT') || str_contains($bt, 'VIE') || str_contains($bt, 'TERRE')) $data['bac_type'] = 'Sciences de la Vie et de la Terre';
            elseif (str_contains($bt, 'MATH')) $data['bac_type'] = 'Sciences Mathématiques';
            elseif (str_contains($bt, 'LETTRE') || str_contains($bt, 'HUMAIN')) $data['bac_type'] = 'Lettres et Sciences Humaines';
        }

        // Normalize Date of Birth (e.g. "1262/2008" or "26/12/2008")
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

        // Auto-Calculate or Normalize Bac Mention
        if (!empty($data['bac_average']) && is_numeric($data['bac_average'])) {
            $avg = (float)$data['bac_average'];
            if (empty($data['bac_mention']) || $data['bac_mention'] === 'Inconnu') {
                if ($avg >= 16) $data['bac_mention'] = 'Très Bien';
                elseif ($avg >= 14) $data['bac_mention'] = 'Bien';
                elseif ($avg >= 12) $data['bac_mention'] = 'Assez Bien';
                elseif ($avg >= 10) $data['bac_mention'] = 'Passable';
            }
        }

        if (!empty($data['bac_mention']) && $data['bac_mention'] !== 'Inconnu') {
            $m = strtoupper(trim($data['bac_mention']));
            if (str_contains($m, 'TRÈS') || str_contains($m, 'TRES')) $data['bac_mention'] = 'Très Bien';
            elseif (str_contains($m, 'ASSEZ')) $data['bac_mention'] = 'Assez Bien';
            elseif (str_contains($m, 'BIEN')) $data['bac_mention'] = 'Bien';
            elseif (str_contains($m, 'PASSABLE')) $data['bac_mention'] = 'Passable';
        }

        // Normalize Gender
        if (!empty($data['gender']) || !empty($data['sexe'])) {
            $g = strtoupper(trim((string)($data['gender'] ?? $data['sexe'] ?? '')));
            if (str_starts_with($g, 'F') || str_contains($g, 'FEMININ') || str_contains($g, 'FILLE')) {
                $data['gender'] = 'female';
            } elseif (str_starts_with($g, 'M') || str_contains($g, 'MASCULIN') || str_contains($g, 'FILS')) {
                $data['gender'] = 'male';
            }
        }

        // Sanitize any missing/unknown values to empty string
        foreach ($data as $key => $val) {
            if (is_null($val) || in_array(strtolower(trim((string)$val)), ['inconnu', 'n/a', 'null', 'none', 'undefined', 'aucun'])) {
                $data[$key] = '';
            }
        }

        return $data;
    }
}
