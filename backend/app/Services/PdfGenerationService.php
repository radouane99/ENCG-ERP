<?php

namespace App\Services;

use App\Models\DocumentRequest;
use App\Models\GeneratedDocument;
use App\Services\Core\PdfEngineService;
use Illuminate\Support\Str;

class PdfGenerationService
{
    public function __construct(
        private PdfEngineService $pdfEngine
    ) {}

    /**
     * Générer un PDF à partir d'une demande de document.
     */
    public function generatePdf(DocumentRequest $documentRequest): string
    {
        $documentType = $documentRequest->documentType;
        $student      = $documentRequest->student;

        $html = $documentType->html_template
            ?? '<h1>' . e($documentType->name ?? 'Document') . '</h1><p>Étudiant : ' . e($student->user->name ?? 'Inconnu') . '</p>';

        $filename  = $documentRequest->reference_number . '.pdf';
        $directory = 'documents/generated/';

        $path = $this->pdfEngine->generateFromHtml($html, $directory, $filename);

        $verificationToken = hash('sha256', $documentRequest->id . time() . Str::random(10));

        GeneratedDocument::create([
            'document_request_id' => $documentRequest->id,
            'file_path'           => $path,
            'verification_token'  => $verificationToken,
            'verification_url'    => config('app.url') . '/verify/document/' . $verificationToken,
            'expires_at'          => now()->addMonths(6),
        ]);

        return $path;
    }
}