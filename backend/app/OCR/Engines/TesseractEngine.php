<?php

namespace App\OCR\Engines;

use App\OCR\Contracts\OcrEngineInterface;
use App\OCR\OcrProcess;
use App\OCR\OcrResult;

/**
 * Tesseract Engine - Version Ultra Rapide
 * Optimisé pour la vitesse avec des passes minimales
 */
class TesseractEngine implements OcrEngineInterface
{
    private string $processId;

    private array $config;

    public function __construct(array $config = [])
    {
        $this->processId = getmypid().'_'.uniqid();
        $this->config = array_merge([
            'dpi' => 200, // Réduit pour la vitesse
            'max_pages' => 2, // Une seule page pour la vitesse
            'enable_roi_cropping' => false, // Désactivé pour la vitesse
            'enable_binarization' => false, // Désactivé pour la vitesse
            'default_lang' => 'ara+fra+eng',
            'quick_mode' => true, // Mode rapide
        ], $config);
    }

    public function getPriority(): int
    {
        return 3; // Priorité moyenne
    }

    public function supports(string $mimeType, string $filePath, string $docType = ''): bool
    {
        $imageTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'image/gif', 'image/webp'];

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
        $root = storage_path('app/private/ocr-tmp');
        if (! is_dir($root) && ! @mkdir($root, 0700, true) && ! is_dir($root)) {
            return new OcrResult('');
        }
        $tmpDir = $root.'/run_'.bin2hex(random_bytes(16));
        if (! @mkdir($tmpDir, 0700)) {
            return new OcrResult('');
        }
        $allText = '';
        $createdFiles = [];

        try {
            // Conversion rapide en image
            $images = $this->toImages($filePath, $mimeType, $tmpDir, $createdFiles);

            if (empty($images)) {
                return new OcrResult('');
            }

            // OCR all extracted pages (e.g. Recto & Verso)
            $availableLangs = $this->getInstalledLanguages();
            $lang = in_array('ara', $availableLangs) && in_array('fra', $availableLangs) ? 'fra+ara' : $this->getBestLanguage($availableLangs);

            foreach ($images as $image) {
                $text = $this->runTesseractPass($image, $lang, 3, $tmpDir, $createdFiles);
                $allText .= "\n".$text;

                if (strlen(trim($text)) < 50 && count($availableLangs) > 1) {
                    $secondLang = $this->getSecondLanguage($availableLangs, $lang);
                    $text2 = $this->runTesseractPass($image, $secondLang, 3, $tmpDir, $createdFiles);
                    if (strlen(trim($text2)) > strlen(trim($text))) {
                        $allText .= "\n".$text2;
                    }
                }
            }

            // Nettoyage rapide
            $allText = $this->quickClean($allText);

            return new OcrResult(trim($allText));

        } catch (\Throwable $e) {
            return new OcrResult('');
        } finally {
            // The directory exists before any producer; partial outputs are included on failure.
            self::removeTemporaryDirectory($tmpDir);
        }
    }

    private function toImages(string $filePath, string $mimeType, string $tmpDir, array &$createdFiles): array
    {
        if ($this->isPdf($mimeType, $filePath)) {
            // Rasterize only a bounded page range at bounded geometry. Never expand
            // every embedded image before deciding which pages to process.
            $maxPages = max(1, min(8, (int) $this->config['max_pages']));
            $tmpPrefix = $tmpDir.'/page';
            OcrProcess::run(sprintf(
                'pdftoppm -png -f 1 -l %d -r 150 -scale-to 2048 %s %s 2>/dev/null',
                $maxPages, escapeshellarg($filePath), escapeshellarg($tmpPrefix)
            ));
            $pages = glob($tmpPrefix.'-*.png') ?: [];
            natsort($pages);
            $pages = array_slice(array_values($pages), 0, $maxPages);
            foreach ($pages as $page) {
                $this->assertImageBounds($page);
            }

            return $pages;
        }

        $this->assertImageBounds($filePath);
        $tmpImg = $tmpDir.'/ocr_img_'.$this->processId.'.png';
        if (@copy($filePath, $tmpImg)) {
            $createdFiles[] = $tmpImg;

            return [$tmpImg];
        }

        return [];
    }

    private function assertImageBounds(string $path): void
    {
        $size = @getimagesize($path);
        if (! $size || $size[0] > 10000 || $size[1] > 10000 || $size[0] * $size[1] > 16000000) {
            throw new \RuntimeException('OCR image geometry exceeds the processing budget.');
        }
    }

    public static function removeTemporaryDirectory(string $directory): void
    {
        // Only direct regular outputs are produced; do not follow links or recurse.
        foreach (glob($directory.'/*') ?: [] as $file) {
            if (is_file($file) || is_link($file)) {
                @unlink($file);
            }
        }
        @rmdir($directory);
    }

    public static function cleanAbandonedDirectories(): int
    {
        $root = storage_path('app/private/ocr-tmp');
        $count = 0;
        foreach (glob($root.'/run_*', GLOB_ONLYDIR) ?: [] as $directory) {
            if (! is_link($directory) && preg_match('/^run_[a-f0-9]{32}$/', basename($directory))
                && filemtime($directory) < time() - 3600) {
                self::removeTemporaryDirectory($directory);
                $count++;
            }
        }

        return $count;
    }

    private function runTesseractPass(
        string $imgPath,
        string $lang,
        int $psm,
        string $tmpDir,
        array &$createdFiles,
        string $extraConfig = ''
    ): string {
        $outPath = $tmpDir.'/ocr_pass_'.$this->processId.'_'.uniqid();
        $txtFile = "{$outPath}.txt";

        $cmd = sprintf(
            'tesseract %s %s -l %s --psm %d 2>/dev/null',
            escapeshellarg($imgPath),
            escapeshellarg($outPath),
            escapeshellarg($lang),
            $psm
        );
        OcrProcess::run($cmd);

        if (file_exists($txtFile)) {
            $createdFiles[] = $txtFile;
            $text = file_get_contents($txtFile, false, null, 0, 1024 * 1024) ?: '';
            @unlink($txtFile);

            return $text;
        }

        return '';
    }

    private function getInstalledLanguages(): array
    {
        $output = [];
        OcrProcess::run('tesseract --list-langs 2>/dev/null', $output);

        $langs = [];
        foreach ($output as $line) {
            $line = trim($line);
            if ($line !== '' && ! str_contains($line, 'List of available languages') && ! str_contains($line, ':')) {
                $langs[] = $line;
            }
        }

        return $langs;
    }

    private function getBestLanguage(array $available): string
    {
        $preferred = ['ara+fra+eng', 'fra+eng', 'ara+eng', 'fra', 'eng', 'ara'];

        foreach ($preferred as $lang) {
            $parts = explode('+', $lang);
            $allAvailable = true;
            foreach ($parts as $part) {
                if (! in_array($part, $available)) {
                    $allAvailable = false;
                    break;
                }
            }
            if ($allAvailable) {
                return $lang;
            }
        }

        return $available[0] ?? 'eng';
    }

    private function getSecondLanguage(array $available, string $currentLang): string
    {
        foreach ($available as $lang) {
            if (! str_contains($currentLang, $lang)) {
                return $lang;
            }
        }

        return $available[0] ?? 'eng';
    }

    private function quickClean(string $text): string
    {
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace("/\n{3,}/", "\n\n", $text);

        return trim($text);
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
        OcrProcess::run("which {$cmd} 2>/dev/null", $output, $returnVar);

        return $returnVar === 0;
    }
}
