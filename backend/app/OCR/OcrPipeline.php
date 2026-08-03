<?php

namespace App\OCR;

use App\OCR\Contracts\OcrEngineInterface;
use Illuminate\Support\Facades\Log;

/**
 * OCR Pipeline (Strategy Chain)
 *
 * Runs registered OCR engines sequentially until valid text is extracted.
 * Standard Chain: PdfTextEngine → TesseractEngine → PdfBinaryEngine
 */
class OcrPipeline
{
    /** @var OcrEngineInterface[] */
    private array $engines = [];

    public function addEngine(OcrEngineInterface $engine): self
    {
        $this->engines[] = $engine;
        return $this;
    }

    /**
     * Process file through the chain of engines.
     *
     * @return string Extracted raw OCR text
     */
    public function process(string $filePath, string $mimeType, string $docType): string
    {
        foreach ($this->engines as $engine) {
            if ($engine->supports($mimeType, $filePath, $docType)) {
                $text = $engine->extract($filePath, $mimeType);
                if (strlen(trim($text)) > 20) {
                    $engineName = class_basename($engine);
                    Log::info("[OcrPipeline] Engine '{$engineName}' success: " . strlen($text) . ' chars');
                    return $text;
                }
            }
        }

        return '';
    }
}
