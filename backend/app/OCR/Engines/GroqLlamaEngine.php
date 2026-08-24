<?php

namespace App\OCR\Engines;

use App\OCR\Contracts\OcrEngineInterface;
use App\OCR\OcrResult;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Groq Llama Vision Engine
 * Utilise l'API Groq (llama-3.2-11b-vision-preview) pour une extraction OCR ultra-rapide.
 */
class GroqLlamaEngine implements OcrEngineInterface
{
    private string $processId;

    private array $config;

    public function __construct(array $config = [])
    {
        $this->processId = getmypid().'_'.uniqid();
        $this->config = array_merge([
            'model' => 'llama-3.2-11b-vision-preview',
            'api_key' => config('services.groq.key'),
            'timeout' => 30,
            'max_tokens' => 2048,
        ], $config);
    }

    public function getPriority(): int
    {
        return 2; // Priority between native PDF parsers (1) and Tesseract (3)
    }

    public function supports(string $mimeType, string $filePath, string $docType = ''): bool
    {
        // Skip if API key is not configured
        if (empty($this->config['api_key'])) {
            return false;
        }

        $imageTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (in_array($mimeType, $imageTypes)) {
            return true;
        }

        if (str_contains(strtolower($mimeType), 'pdf')) {
            return true;
        }

        return false;
    }

    public function extractText(string $filePath): string
    {
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
        $result = $this->extract($filePath, $mimeType, '');

        return $result->text;
    }

    public function extract(string $filePath, string $mimeType, string $docType = ''): OcrResult
    {
        $tmpDir = sys_get_temp_dir();
        $createdFiles = [];

        try {
            $images = $this->toImages($filePath, $mimeType, $tmpDir, $createdFiles);

            if (empty($images)) {
                return new OcrResult('');
            }

            // Take the first page only for now to save tokens and time
            $imagePath = $images[0];
            $base64Image = base64_encode(file_get_contents($imagePath));

            // Re-detect actual image mime type after conversion
            $imageMimeType = mime_content_type($imagePath) ?: 'image/png';

            $prompt = 'Extract all text from this document as accurately as possible. Output only the extracted text, maintaining the original structure and formatting where possible. Do not include any conversational filler.';

            $response = Http::withToken($this->config['api_key'])
                ->timeout($this->config['timeout'])
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => $this->config['model'],
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => [
                                [
                                    'type' => 'text',
                                    'text' => $prompt,
                                ],
                                [
                                    'type' => 'image_url',
                                    'image_url' => [
                                        'url' => "data:{$imageMimeType};base64,{$base64Image}",
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'max_tokens' => $this->config['max_tokens'],
                    'temperature' => 0.1, // Low temperature for factual extraction
                ]);

            if ($response->failed()) {
                Log::error('[GroqLlamaEngine] API Error: '.$response->body());

                return new OcrResult('');
            }

            $data = $response->json();
            $text = $data['choices'][0]['message']['content'] ?? '';

            return new OcrResult(trim($text));

        } catch (\Throwable $e) {
            Log::error('[GroqLlamaEngine] Exception: '.$e->getMessage());

            return new OcrResult('');
        } finally {
            foreach ($createdFiles as $file) {
                if (file_exists($file)) {
                    @unlink($file);
                }
            }
        }
    }

    private function toImages(string $filePath, string $mimeType, string $tmpDir, array &$createdFiles): array
    {
        if ($this->isPdf($mimeType, $filePath)) {
            if (! $this->hasCommand('pdftoppm')) {
                return [];
            }

            $tmpPrefix = $tmpDir.'/groq_pdf_pg_'.$this->processId;
            // -png creates .png files
            $cmd = sprintf('pdftoppm -png -r 150 -l 1 %s %s 2>/dev/null',
                escapeshellarg($filePath),
                escapeshellarg($tmpPrefix)
            );
            @exec($cmd);

            $pages = glob("{$tmpPrefix}*.png") ?: [];
            foreach ($pages as $p) {
                $createdFiles[] = $p;
            }

            return array_slice($pages, 0, 1);
        }

        $tmpImg = $tmpDir.'/groq_img_'.$this->processId.'.png';
        if (@copy($filePath, $tmpImg)) {
            $createdFiles[] = $tmpImg;

            return [$tmpImg];
        }

        return [];
    }

    private function isPdf(string $mimeType, string $filePath): bool
    {
        if (str_contains(strtolower($mimeType), 'pdf')) {
            return true;
        }

        $raw = @file_get_contents($filePath, false, null, 0, 4);

        return str_starts_with((string) $raw, '%PDF');
    }

    private function hasCommand(string $cmd): bool
    {
        $returnVar = -1;
        $output = [];
        @exec("which {$cmd} 2>/dev/null", $output, $returnVar);

        return $returnVar === 0;
    }
}
