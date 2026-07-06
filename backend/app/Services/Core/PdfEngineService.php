<?php

namespace App\Services\Core;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PdfEngineService
{
    /**
     * Load an HTML string and generate a PDF, saving it to storage.
     * Returns the relative storage path.
     */
    public function generateFromHtml(string $html, string $directory, string $filename): string
    {
        $pdf = Pdf::loadHTML($html);
        return $this->savePdf($pdf, $directory, $filename);
    }

    /**
     * Load a Blade view and generate a PDF, saving it to storage.
     * Returns the relative storage path.
     */
    public function generateFromView(string $view, array $data, string $directory, string $filename): string
    {
        $pdf = Pdf::loadView($view, $data);
        return $this->savePdf($pdf, $directory, $filename);
    }

    /**
     * Helper to save PDF and ensure directory exists (via Storage).
     */
    private function savePdf($pdf, string $directory, string $filename): string
    {
        $path = rtrim($directory, '/') . '/' . ltrim($filename, '/');
        
        // Ensure path has .pdf extension
        if (!str_ends_with($path, '.pdf')) {
            $path .= '.pdf';
        }

        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }
}
