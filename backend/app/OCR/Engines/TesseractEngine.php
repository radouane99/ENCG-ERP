<?php

namespace App\OCR\Engines;

use App\OCR\Contracts\OcrEngineInterface;
use App\OCR\OcrResult;
use Illuminate\Support\Facades\Log;

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
        $this->processId = getmypid() . '_' . uniqid();
        $this->config = array_merge([
            'dpi' => 200, // Réduit pour la vitesse
            'max_pages' => 1, // Une seule page pour la vitesse
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
        $tmpDir = sys_get_temp_dir();
        $allText = '';
        $createdFiles = [];

        try {
            // Conversion rapide en image
            $images = $this->toImages($filePath, $mimeType, $tmpDir, $createdFiles);

            if (empty($images)) {
                return new OcrResult('');
            }

            // Une seule image pour la vitesse
            $image = $images[0];
            $availableLangs = $this->getInstalledLanguages();
            $lang = $this->getBestLanguage($availableLangs);

            // Une seule passe OCR
            $text = $this->runTesseractPass($image, $lang, 3, $tmpDir, $createdFiles);
            $allText .= $text;

            // Si le texte est court, essayer avec une autre langue
            if (strlen(trim($text)) < 50 && count($availableLangs) > 1) {
                $secondLang = $this->getSecondLanguage($availableLangs, $lang);
                $text2 = $this->runTesseractPass($image, $secondLang, 3, $tmpDir, $createdFiles);
                if (strlen(trim($text2)) > strlen(trim($text))) {
                    $allText = $text2;
                }
            }

            // Nettoyage rapide
            $allText = $this->quickClean($allText);

            return new OcrResult(trim($allText));

        } catch (\Throwable $e) {
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
            if (!$this->hasCommand('pdftoppm')) {
                return [];
            }

            $tmpPrefix = $tmpDir . '/pdf_pg_' . $this->processId;
            $cmd = sprintf('pdftoppm -png -r 150 -l 1 %s %s 2>/dev/null', // r 150 pour la vitesse
                escapeshellarg($filePath),
                escapeshellarg($tmpPrefix)
            );
            @exec($cmd);

            $pages = glob("{$tmpPrefix}*.png") ?: [];
            foreach ($pages as $p) {
                $createdFiles[] = $p;
            }
            
            // Limiter à une page
            return array_slice($pages, 0, 1);
        }

        $tmpImg = $tmpDir . '/ocr_img_' . $this->processId . '.png';
        if (@copy($filePath, $tmpImg)) {
            $createdFiles[] = $tmpImg;
            return [$tmpImg];
        }

        return [];
    }

    private function runTesseractPass(
        string $imgPath,
        string $lang,
        int $psm,
        string $tmpDir,
        array &$createdFiles,
        string $extraConfig = ''
    ): string {
        $outPath = $tmpDir . '/ocr_pass_' . $this->processId . '_' . uniqid();
        $txtFile = "{$outPath}.txt";

        // Options de vitesse
        $cmd = sprintf(
            'tesseract %s %s -l %s --psm %d -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀ-ÿ\x{0600}-\x{06FF} 2>/dev/null',
            escapeshellarg($imgPath),
            escapeshellarg($outPath),
            escapeshellarg($lang),
            $psm
        );
        @exec($cmd);

        if (file_exists($txtFile)) {
            $createdFiles[] = $txtFile;
            $text = file_get_contents($txtFile) ?: '';
            @unlink($txtFile);
            return $text;
        }

        return '';
    }

    private function getInstalledLanguages(): array
    {
        $output = [];
        @exec('tesseract --list-langs 2>/dev/null', $output);

        $langs = [];
        foreach ($output as $line) {
            $line = trim($line);
            if ($line !== '' && !str_contains($line, 'List of available languages') && !str_contains($line, ':')) {
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
                if (!in_array($part, $available)) {
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
            if (!str_contains($currentLang, $lang)) {
                return $lang;
            }
        }
        return $available[0] ?? 'eng';
    }

    private function quickClean(string $text): string
    {
        $text = preg_replace('/\s+/', ' ', $text);
        $text = preg_replace("/\n{3,}/", "\n\n", $text);
        return trim($text);
    }

    private function isPdf(string $mimeType, string $filePath): bool
    {
        if (str_contains(strtolower($mimeType), 'pdf')) {
            return true;
        }

        $raw = @file_get_contents($filePath, false, null, 0, 4);
        return str_starts_with((string)$raw, '%PDF');
    }

    private function hasCommand(string $cmd): bool
    {
        $returnVar = -1;
        $output = [];
        @exec("which {$cmd} 2>/dev/null", $output, $returnVar);
        return $returnVar === 0;
    }
}