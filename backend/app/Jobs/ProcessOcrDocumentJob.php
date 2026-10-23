<?php

namespace App\Jobs;

use App\Services\Ocr\OcrExtractionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ProcessOcrDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 50;

    public function __construct(
        public string $diskPath,
        public string $mime,
        public string $originalName,
        public string $docType,
        public string $cacheKey
    ) {}

    public function handle(OcrExtractionService $ocr): void
    {
        $absolute = Storage::disk('local')->path($this->diskPath);
        try {
            $result = $ocr->extractFromPath($absolute, $this->mime, $this->originalName, $this->docType);
            Cache::put($this->cacheKey, $result, now()->addMinutes(15));
        } finally { Storage::disk('local')->delete($this->diskPath); }
    }

    public function failed(?\Throwable $e): void
    {
        Cache::put($this->cacheKey, ['success' => false, 'message' => 'Extraction indisponible. Utilisez le dossier admissions.'], now()->addMinutes(15));
        Storage::disk('local')->delete($this->diskPath);
    }
}
