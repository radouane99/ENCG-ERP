<?php

namespace App\Services;

use App\Models\DocumentRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PdfGenerationService
{
    public function generatePdf(DocumentRequest $documentRequest)
    {
        $template = $documentRequest->template;
        $student = $documentRequest->user;
        
        $html = $template->html_template ?? '<h1>' . ($template->name ?? 'Document') . '</h1><p>Student: ' . ($student->name ?? 'Unknown') . '</p>';
        
        $pdf = Pdf::loadHTML($html);
        $content = $pdf->output();
        
        $filename = 'documents/generated/' . $documentRequest->reference_number . '.pdf';
        
        Storage::disk('public')->put($filename, $content);
        
        $additional = $documentRequest->additional_data ?? [];
        $additional['generated_file'] = $filename;
        $documentRequest->update(['additional_data' => $additional]);
        
        return $filename;
    }
}
