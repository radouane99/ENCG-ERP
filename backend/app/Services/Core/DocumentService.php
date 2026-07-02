<?php

namespace App\Services\Core;

use Illuminate\Support\Str;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class DocumentService
{
    /**
     * Generate an official document (e.g. Attestation de scolarité).
     * Secures it with a unique tracking UUID and QR Code.
     */
    public function generateAttestation(Student $student, string $type = 'scolarite'): array
    {
        $trackingCode = Str::uuid()->toString();
        
        $verifyUrl = url('/verify-document/' . $trackingCode);
        
        // Use DomPDF to generate the document
        $pdf = Pdf::loadView('pdf.attestation', [
            'student' => $student,
            'trackingCode' => $trackingCode,
            'verifyUrl' => $verifyUrl,
            'year' => '2025/2026' // Dynamic in real app
        ]);
        
        $filename = "attestation_{$student->id}_{$trackingCode}.pdf";
        $path = "public/documents/{$filename}";
        
        Storage::put($path, $pdf->output());

        // Insert into DB
        DB::table('generated_documents')->insert([
            'document_request_id' => 1, // Optional link to request
            'file_path' => Storage::url($path),
            'verification_token' => $trackingCode,
            'verification_url' => $verifyUrl,
            'expires_at' => now()->addYears(1),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return [
            'success' => true,
            'tracking_code' => $trackingCode,
            'url' => url(Storage::url($path)),
            'message' => 'Document PDF sécurisé généré avec succès.'
        ];
    }

    /**
     * Verify the authenticity of a document using its tracking code.
     */
    public function verifyDocument(string $trackingCode): array
    {
        $document = DB::table('generated_documents')->where('verification_token', $trackingCode)->first();

        if ($document && ($document->expires_at == null || now()->lessThan($document->expires_at))) {
            return [
                'valid' => true,
                'document' => [
                    'type' => 'Attestation Officielle',
                    'issued_at' => \Carbon\Carbon::parse($document->created_at)->format('d/m/Y H:i:s'),
                    'url' => url($document->file_path)
                ]
            ];
        }

        return ['valid' => false];
    }
}
