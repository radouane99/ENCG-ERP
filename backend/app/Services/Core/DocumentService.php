<?php

namespace App\Services\Core;

use App\Models\GeneratedDocument;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentService
{
    /**
     * Legacy helper kept for compatibility.
     */
    public function generateAttestation(Student $student, string $type = 'scolarite'): array
    {
        $trackingCode = Str::uuid()->toString();
        $verifyUrl = route('document.verify', ['documentId' => $trackingCode]);

        $pdf = Pdf::loadView('pdf.attestation', [
            'student' => $student,
            'trackingCode' => $trackingCode,
            'verifyUrl' => $verifyUrl,
            'year' => now()->year . '/' . (now()->year + 1),
        ]);

        $filename = "attestation_{$student->id}_{$trackingCode}.pdf";
        $path = "documents/legacy/{$filename}";

        Storage::disk('private')->put($path, $pdf->output());

        $document = GeneratedDocument::create([
            'student_id' => $student->id,
            'document_type' => $type,
            'file_path' => $path,
            'verification_token' => $trackingCode,
            'verification_url' => $verifyUrl,
            'expires_at' => now()->addYears(1),
        ]);

        return [
            'success' => true,
            'tracking_code' => $trackingCode,
            'document_id' => $document->id,
            'message' => 'Document PDF sécurisé généré avec succès.',
        ];
    }

    /**
     * Verify the authenticity of a document using its tracking code.
     */
    public function verifyDocument(string $trackingCode): array
    {
        $document = GeneratedDocument::with(['student.user'])
            ->where('verification_token', $trackingCode)
            ->first();

        if ($document && ($document->expires_at === null || now()->lessThan($document->expires_at))) {
            return [
                'valid' => true,
                'document' => [
                    'type' => $document->document_type ?? 'Document officiel',
                    'issued_at' => $document->created_at?->format('d/m/Y H:i:s'),
                    'student_name' => $document->student?->user?->name,
                    'status' => 'Authentique',
                ],
            ];
        }

        return ['valid' => false];
    }
}
