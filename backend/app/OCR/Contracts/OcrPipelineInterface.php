<?php

namespace App\OCR\Contracts;

use App\OCR\OcrResult;

interface OcrPipelineInterface
{
    public function registerEngine(OcrEngineInterface $engine): void;

    public function process(string $filePath, string $docType = ''): OcrResult;
}
