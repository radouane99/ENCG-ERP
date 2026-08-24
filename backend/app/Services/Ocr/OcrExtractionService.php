<?php

namespace App\Services\Ocr;

use App\Services\AI\GeminiApiService;
use Illuminate\Http\UploadedFile;

class OcrExtractionService
{
    public function __construct(private GeminiApiService $geminiService) {}

    /**
     * @return array{success: bool, ocr_data: mixed, message: string, debug_info: array<string, mixed>}
     */
    public function extractFromPath(string $path, string $mime, string $originalName, string $docType): array
    {
        $ocrData = $this->geminiService->extractDocumentOcr($path, $mime, $originalName, $docType);
        $lastError = $this->geminiService->getLastError();

        if (empty($ocrData)) {
            return [
                'success' => false,
                'ocr_data' => null,
                'message' => 'Extraction OCR impossible.',
                'debug_info' => [
                    'file_name' => $originalName,
                    'mime_type' => $mime,
                    'last_error' => $lastError ?: 'Raison inconnue',
                ],
            ];
        }

        return [
            'success' => true,
            'ocr_data' => $ocrData,
            'message' => 'Extraction réussie.',
            'debug_info' => [
                'file_name' => $originalName,
                'mime_type' => $mime,
                'last_error' => $lastError ?: 'Succès - Aucune erreur',
            ],
        ];
    }

    /**
     * @return array{success: bool, ocr_data: mixed, message: string, debug_info: array<string, mixed>}
     */
    public function extractFromUpload(UploadedFile $file, string $docType): array
    {
        $result = $this->extractFromPath(
            $file->getRealPath() ?: '',
            $file->getClientMimeType() ?: 'application/pdf',
            $file->getClientOriginalName(),
            $docType
        );
        $result['debug_info']['file_size'] = $file->getSize();

        return $result;
    }
}
