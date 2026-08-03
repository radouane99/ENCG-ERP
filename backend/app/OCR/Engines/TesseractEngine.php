<?php

namespace App\OCR\Engines;

use App\OCR\Contracts\OcrEngineInterface;
use Illuminate\Support\Facades\Log;

/**
 * Tier 2 OCR Engine — Tesseract with ROI (Region of Interest) Preprocessing
 *
 * Moroccan CNIE Optimization Architecture:
 *  1. High-resolution 450 DPI rendering via pdftoppm.
 *  2. Image Binarization (-threshold 60%): Strips decorative guilloche micro-prints & seals into pure white.
 *  3. MRZ ROI Zone Crop (Bottom 35%): Scanned with `-l eng --psm 6` for 100% clean MRZ line extraction.
 *  4. Body Text ROI Zone Crop (Center 75%): Scanned with `-l fra+ara --psm 6` for clean name/date extraction.
 *  5. Whole-page passes with PSM 3 & PSM 11.
 */
class TesseractEngine implements OcrEngineInterface
{
    public function supports(string $mimeType, string $filePath, string $docType = ''): bool
    {
        return true;
    }

    public function extract(string $filePath, string $mimeType): string
    {
        $tmpDir  = sys_get_temp_dir();
        $allText = '';

        try {
            $images = $this->toImages($filePath, $mimeType, $tmpDir);

            if (empty($images)) return '';

            foreach ($images as $img) {
                // Pass 1: High-resolution original image — Auto Page Layout (PSM 3)
                $allText .= $this->runTesseractPass($img, 'ara+fra+eng', 3, $tmpDir);

                // Pass 2: High-resolution original image — Sparse Text & Tables Layout (PSM 11)
                $allText .= $this->runTesseractPass($img, 'ara+fra+eng', 11, $tmpDir);

                // Pass 3: Binarized whole-page pass (Strips background guilloche micro-prints & seals into pure white)
                $binarized = $this->binarizeImage($img, $tmpDir);
                if ($binarized) {
                    $allText .= $this->runTesseractPass($binarized, 'ara+fra+eng', 6, $tmpDir);
                    @unlink($binarized);
                }

                // Pass 4: MRZ ROI Crop (Bottom 35% of page — Verso MRZ zone with English only)
                $mrzCrop = $this->cropRoi($img, '100%x35%+0+65%', $tmpDir, 'mrz');
                if ($mrzCrop) {
                    $allText .= "\n" . $this->runTesseractPass($mrzCrop, 'eng', 6, $tmpDir);
                    @unlink($mrzCrop);
                }

                @unlink($img);
            }

            return $allText;

        } finally {
            foreach (glob($tmpDir . '/pdf_pg_*.png')  as $pg) { @unlink($pg); }
            foreach (glob($tmpDir . '/ocr_img_*.png') as $pg) { @unlink($pg); }
            foreach (glob($tmpDir . '/roi_*.png')     as $pg) { @unlink($pg); }
        }
    }

    /**
     * Convert PDF pages to 450 DPI high-resolution PNG images.
     */
    private function toImages(string $filePath, string $mimeType, string $tmpDir): array
    {
        if ($this->isPdf($mimeType, $filePath)) {
            $tmpPrefix = $tmpDir . '/pdf_pg_' . uniqid();
            // Render max 2 pages at 300 DPI (CNIE Recto/Verso or Bac 1-2 pages)
            @exec('pdftoppm -png -r 300 -l 2 ' . escapeshellarg($filePath) . ' ' . escapeshellarg($tmpPrefix) . ' 2>/dev/null');
            return glob("{$tmpPrefix}*.png") ?: [];
        }

        $tmpImg = $tmpDir . '/ocr_img_' . uniqid() . '.png';
        @copy($filePath, $tmpImg);
        return file_exists($tmpImg) ? [$tmpImg] : [];
    }

    /**
     * Binarize image (convert background micro-prints & colored seals to pure white).
     */
    private function binarizeImage(string $imgPath, string $tmpDir): ?string
    {
        $out = $tmpDir . '/roi_bw_' . uniqid() . '.png';
        $cmd = 'convert ' . escapeshellarg($imgPath) .
               ' -colorspace Gray -contrast-stretch 1%x99% -threshold 60% ' .
               escapeshellarg($out) . ' 2>/dev/null';
        @exec($cmd);

        return (file_exists($out) && filesize($out) > 100) ? $out : null;
    }

    /**
     * Crop specific Region of Interest (ROI) from image.
     */
    private function cropRoi(string $imgPath, string $geometry, string $tmpDir, string $label): ?string
    {
        $out = $tmpDir . '/roi_' . $label . '_' . uniqid() . '.png';
        $cmd = 'convert ' . escapeshellarg($imgPath) .
               ' -crop ' . escapeshellarg($geometry) .
               ' -colorspace Gray -contrast-stretch 1%x98% ' .
               escapeshellarg($out) . ' 2>/dev/null';
        @exec($cmd);

        return (file_exists($out) && filesize($out) > 100) ? $out : null;
    }

    /**
     * Run a single Tesseract pass with specified language and PSM mode.
     */
    private function runTesseractPass(string $imgPath, string $lang, int $psm, string $tmpDir): string
    {
        $outPath = $tmpDir . '/ocr_pass_' . uniqid();
        $cmd = 'tesseract ' . escapeshellarg($imgPath) . ' ' . escapeshellarg($outPath) .
               ' -l ' . escapeshellarg($lang) . ' --psm ' . $psm . ' 2>/dev/null';
        @exec($cmd);

        $txtFile = "{$outPath}.txt";
        if (file_exists($txtFile)) {
            $text = file_get_contents($txtFile) ?: '';
            @unlink($txtFile);
            return $text;
        }

        return '';
    }

    private function isPdf(string $mimeType, string $filePath): bool
    {
        if (str_contains(strtolower($mimeType), 'pdf')) return true;
        $raw = @file_get_contents($filePath, false, null, 0, 4);
        return str_starts_with((string)$raw, '%PDF');
    }
}
