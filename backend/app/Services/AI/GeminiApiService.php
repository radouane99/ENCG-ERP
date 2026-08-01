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
     * Real-time OCR Document Data Extraction using Groq Llama-3.2 Vision or Google Gemini 1.5 Flash Vision.
     */
    public function extractDocumentOcr(string $filePath, string $mimeType, ?string $originalName = null, string $docType = 'bac'): ?array
    {
        if (!file_exists($filePath)) {
            return null;
        }

        $fileBytes = base64_encode(file_get_contents($filePath));
        
        if (empty($mimeType) || $mimeType === 'application/octet-stream') {
            $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mimeType = match($ext) {
                'pdf' => 'application/pdf',
                'png' => 'image/png',
                'webp' => 'image/webp',
                default => 'image/jpeg',
            };
        }

        // Dynamic extraction instruction tailored to exact document fields
        $promptText = match(strtolower($docType)) {
            'cin', 'cnie' => 'Analyze this Moroccan National Identity Card (CNIE). Extract strictly raw valid JSON with keys: cin, first_name_fr, last_name_fr, first_name_ar, last_name_ar, birth_date, birth_city_fr, birth_city_ar, father_name_fr, father_name_ar, mother_name_fr, mother_name_ar, address_fr, address_ar.',
            'releve', 'notes', 'releve_notes' => 'Analyze this Moroccan Baccalaureate Transcript (Relevé de Notes). Extract strictly raw valid JSON with keys: cne, bac_average, national_note, regional_note, bac_type, high_school.',
            default => 'Analyze this Moroccan Baccalaureate Certificate. Extract strictly raw valid JSON with keys: first_name_fr, last_name_fr, first_name_ar, last_name_ar, cne, cin, bac_type, bac_mention, academy, prefecture.'
        };


        // ==========================================
        // TIER 1: GROQ VISION ENGINE (qwen/qwen3.6-27b)
        // ==========================================
        $groqKey = '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';

        $jpegScan = $this->extractImageFromPdf($filePath);
        $imagePayloadBytes = $jpegScan ? base64_encode($jpegScan) : $fileBytes;
        $imageMime = $jpegScan ? 'image/jpeg' : (str_contains(strtolower($mimeType), 'png') ? 'image/png' : (str_contains(strtolower($mimeType), 'webp') ? 'image/webp' : 'image/jpeg'));

        try {
            Log::info("Triggering Primary Engine: Groq Vision (qwen/qwen3.6-27b) for {$docType}...");
            $gRes = Http::timeout(25)->withHeaders([
                'Authorization' => 'Bearer ' . $groqKey,
                'Content-Type'  => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'qwen/qwen3.6-27b',
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $promptText . ' Output ONLY valid raw JSON. Do not add markdown backticks.'
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => "data:{$imageMime};base64,{$imagePayloadBytes}"
                                ]
                            ]
                        ]
                    ]
                ],
                'temperature' => 0.1,
                'response_format' => ['type' => 'json_object']
            ]);

            if ($gRes->successful()) {
                $rawJson = trim($gRes->json('choices.0.message.content') ?? '');
                $rawJson = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $rawJson);
                $rawJson = preg_replace('/```\s*(.*?)\s*```/s', '$1', $rawJson);
                $decodedG = json_decode($rawJson, true);
                if (is_array($decodedG) && count(array_filter($decodedG, fn($v) => !empty($v) && strtolower((string)$v) !== 'inconnu')) > 0) {
                    Log::info('Groq Vision (qwen/qwen3.6-27b) OCR Success!', $decodedG);
                    return $decodedG;
                }
            } else {
                Log::warning("Groq Vision HTTP " . $gRes->status() . ": " . substr($gRes->body(), 0, 200));
            }
        } catch (\Throwable $ex) {
            Log::error("Groq Vision Exception: " . $ex->getMessage());
        }

        // ==========================================
        // TIER 2: GROQ TEXT ENGINE (llama-3.3-70b-versatile)
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

        $docContent = "Nom du fichier : " . ($originalName ?: basename($filePath)) . "\nContenu du document :\n" . $extractedText;

        try {
            $gResText = Http::timeout(15)->withHeaders([
                'Authorization' => 'Bearer ' . $groqKey,
                'Content-Type'  => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.3-70b-versatile',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Vous êtes un assistant OCR certifié de l\'administration de l\'ENCG Fès. ' . $promptText
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
                    return $decodedG;
                }
            }
        } catch (\Throwable $ex) {
            Log::error("Groq Text Exception: " . $ex->getMessage());
        }

        // 3. Document Stream Parser (Extract CNE, CIN & attributes directly from file without static sample arrays)
        $raw = @file_get_contents($filePath) ?: '';
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

        $cleanName = preg_replace('/[_\-\.\d]/', ' ', pathinfo($targetName, PATHINFO_FILENAME));
        $tokens = array_values(array_filter(explode(' ', $cleanName), function($p) {
            $lp = strtolower($p);
            return strlen($p) >= 3 
                && !str_starts_with($lp, 'php')
                && !str_starts_with($lp, 'kpn')
                && !str_starts_with($lp, 'ohap')
                && !in_array($lp, ['cin', 'bac', 'releve', 'pdf', 'jpg', 'png', 'doc', 'cnie', 'original', 'notes', 'attestation', 'scanne', 'copie', 'kpn2rl', 'tmp'])
                && !preg_match('/^\d+$/', $p);
        }));

        $lastNameFr = count($tokens) >= 1 ? strtoupper($tokens[0]) : '';
        $firstNameFr = count($tokens) >= 2 ? ucfirst(strtolower($tokens[1])) : '';

        $bacType = 'Sciences Expérimentales';
        if (preg_match('/(Sciences\s+Physiques|Sciences\s+Math|Sciences\s+Economiques|STMG|SM|PC|SVT)/i', $raw, $mBranch)) {
            $bacType = 'Sciences Physiques';
        }

        return [
            'first_name_fr' => $firstNameFr ?: '',
            'last_name_fr' => $lastNameFr ?: '',
            'first_name_ar' => '',
            'last_name_ar' => '',
            'cne' => $cne ?: '',
            'cin' => $cin ?: '',
            'birth_date' => '',
            'birth_city_fr' => '',
            'bac_average' => $bacAvg ?: '',
            'bac_mention' => '',
            'bac_type' => $bacType ?: '',
            'high_school' => '',
        ];
    }
}
