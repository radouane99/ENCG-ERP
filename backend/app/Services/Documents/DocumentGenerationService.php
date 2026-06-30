<?php

namespace App\Services\Documents;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DocumentGenerationService
{
    /**
     * Simulate document generation with a cryptographic QR hash
     */
    public function generateAntiFraudDocument(int $studentId, string $documentType): array
    {
        $student = DB::table('students')->find($studentId);
        if (!$student) {
            throw new \Exception("Student not found");
        }

        // Generate a unique cryptographic hash
        $verificationToken = hash('sha256', $studentId . $documentType . time() . Str::random(10));
        
        // In a real app, this would point to the frontend verification route
        $verificationUrl = config('app.url') . "/verify-document/" . $verificationToken;

        // Mock saving the document record (Assuming we don't have document_requests setup perfectly in mock, we insert directly)
        $docId = DB::table('generated_documents')->insertGetId([
            'document_request_id' => 1, // Mock request id
            'file_path' => '/storage/documents/' . $verificationToken . '.pdf',
            'verification_token' => $verificationToken,
            'verification_url' => $verificationUrl,
            'expires_at' => now()->addYears(5),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return [
            'success' => true,
            'document_id' => $docId,
            'student_name' => $student->first_name . ' ' . $student->last_name,
            'document_type' => $documentType,
            'verification_token' => $verificationToken,
            'verification_url' => $verificationUrl,
            'message' => 'Document généré avec QR Code cryptographique.'
        ];
    }

    /**
     * Verify a document by its token
     */
    public function verifyDocument(string $token): array
    {
        $document = DB::table('generated_documents')->where('verification_token', $token)->first();

        if (!$document) {
            return [
                'is_valid' => false,
                'message' => 'Document introuvable ou falsifié.'
            ];
        }

        if ($document->expires_at && now()->greaterThan($document->expires_at)) {
            return [
                'is_valid' => false,
                'message' => 'Ce document a expiré.'
            ];
        }

        // We would join with students to get real details, mocking for now
        return [
            'is_valid' => true,
            'document_type' => 'Certificat de Scolarité', // Mock
            'issued_at' => $document->created_at,
            'student_name' => 'John Doe', // Mock
            'student_number' => '2023001' // Mock
        ];
    }
}
