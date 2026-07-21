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

        // Ensure a corresponding document request exists
        $docRequest = DB::table('document_requests')
            ->where('student_id', $studentId)
            ->where('document_type', $documentType)
            ->first();

        if (! $docRequest) {
            throw new \Exception('Document request not found for this student and document type');
        }

        $docId = DB::table('generated_documents')->insertGetId([
            'document_request_id' => $docRequest->id,
            'file_path' => '/storage/documents/' . $verificationToken . '.pdf',
            'verification_token' => $verificationToken,
            'verification_url' => $verificationUrl,
            'expires_at' => now()->addYears(5),
            'created_at' => now(),
            'updated_at' => now(),
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

        $docRequest = DB::table('document_requests')->where('id', $document->document_request_id)->first();

        $studentInfo = null;
        if ($docRequest) {
            $studentInfo = DB::table('students')->where('id', $docRequest->student_id)->first();
        }

        return [
            'is_valid' => true,
            'document_type' => $docRequest->document_type ?? null,
            'issued_at' => $document->created_at,
            'student_name' => $studentInfo ? ($studentInfo->first_name . ' ' . $studentInfo->last_name) : null,
            'student_number' => $studentInfo->student_number ?? null,
        ];
    }
}
