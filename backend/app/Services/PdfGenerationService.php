<?php

namespace App\Services;

use App\Models\DocumentRequest;
use App\Models\GeneratedDocument;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use App\Services\Core\PdfEngineService;

class PdfGenerationService
{
    protected PdfEngineService $pdfEngine;

    public function __construct(PdfEngineService $pdfEngine)
    {
        $this->pdfEngine = $pdfEngine;
    }
    public function generatePdf(DocumentRequest $documentRequest)
    {
        $template = $documentRequest->template;
        $student = $documentRequest->user;
        
        $html = $template->html_template ?? '<h1>' . ($template->name ?? 'Document') . '</h1><p>Student: ' . ($student->name ?? 'Unknown') . '</p>';
        
        $filename = $documentRequest->reference_number . '.pdf';
        $directory = 'documents/generated/';
        
        $path = $this->pdfEngine->generateFromHtml($html, $directory, $filename);
        
        $verificationToken = hash('sha256', $documentRequest->id . time() . Str::random(10));
        
        GeneratedDocument::create([
            'document_request_id' => $documentRequest->id,
            'file_path' => $path,
            'verification_token' => $verificationToken,
            'verification_url' => config('app.url') . "/verify/document/" . $verificationToken,
            'expires_at' => now()->addMonths(6),
        ]);
        
        return $path;
    }
}
