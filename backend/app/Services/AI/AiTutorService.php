<?php

namespace App\Services\AI;

use App\Models\LearningMaterial;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Log;

class AiTutorService
{
    protected GeminiApiService $geminiApi;
    protected Parser $pdfParser;

    public function __construct(GeminiApiService $geminiApi, Parser $pdfParser)
    {
        $this->geminiApi = $geminiApi;
        $this->pdfParser = $pdfParser;
    }

    /**
     * Parse PDFs from a module and query Gemini
     */
    public function askTutor(int $moduleId, string $question): array
    {
        // 1. Fetch PDF materials for the module
        $materials = LearningMaterial::where('module_id', $moduleId)
            ->where('type', 'document')
            ->whereNotNull('file_path')
            ->get();

        $contextText = '';
        $charLimit = 60000;

        // 2. Parse PDFs up to the character limit
        foreach ($materials as $material) {
            if (strlen($contextText) >= $charLimit) break;

            $path = Storage::disk('public')->path($material->file_path);
            
            if (file_exists($path) && str_ends_with(strtolower($path), '.pdf')) {
                try {
                    $pdf = $this->pdfParser->parseFile($path);
                    $text = $pdf->getText();
                    $contextText .= "\n\n--- Document: {$material->title} ---\n\n" . $text;
                } catch (\Exception $e) {
                    Log::warning("Could not parse PDF {$path}: " . $e->getMessage());
                }
            }
        }

        // Limit the context text to prevent sending too much data to the API
        if (strlen($contextText) > $charLimit) {
            $contextText = substr($contextText, 0, $charLimit) . "...[TRUNCATED]";
        }

        if (empty(trim($contextText))) {
            return [
                'success' => false,
                'reply' => "Je n'ai trouvé aucun support de cours PDF pour ce module. Je ne peux donc pas répondre à votre question en me basant sur le cours."
            ];
        }

        // 3. Query Gemini
        $reply = $this->geminiApi->virtualTutorResponse($question, $contextText);

        return [
            'success' => true,
            'reply' => $reply
        ];
    }
}
