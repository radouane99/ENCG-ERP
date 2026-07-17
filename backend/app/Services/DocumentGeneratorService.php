<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use App\Models\Student;
use App\Models\ExamSession;
use App\Services\Core\PdfEngineService;

use App\Models\GeneratedDocument;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class DocumentGeneratorService
{
    protected PdfEngineService $pdfEngine;

    public function __construct(PdfEngineService $pdfEngine)
    {
        $this->pdfEngine = $pdfEngine;
    }
    /**
     * Generate a PDF for an exam convocation.
     */
    public function generateConvocation(Student $student, ExamSession $session): string
    {
        $token = Str::uuid()->toString();
        $verifyUrl = config('app.url') . "/api/documents/verify/{$token}";
        $qrCodeSvg = QrCode::format('svg')->size(120)->generate($verifyUrl);
        $qrCodeBase64 = base64_encode($qrCodeSvg);

        $data = [
            'student' => $student,
            'session' => $session,
            'qrCodeBase64' => $qrCodeBase64,
            'verifyUrl' => $verifyUrl
        ];

        $filename = "student_{$student->id}_" . time() . ".pdf";
        $directory = "convocations/session_{$session->id}";
        
        $path = $this->pdfEngine->generateFromView('pdf.convocation', $data, $directory, $filename);

        GeneratedDocument::create([
            'student_id' => $student->id,
            'document_type' => 'convocation',
            'file_path' => $path,
            'verification_token' => $token,
            'verification_url' => $verifyUrl,
            'expires_at' => null
        ]);

        return $path;
    }

    /**
     * Generate an official grade transcript (Relevé de notes).
     */
    public function generateTranscript(Student $student, int $academicYearId): string
    {
        // Fetch all grades for this student and academic year
        $grades = $student->grades()->where('academic_year_id', $academicYearId)->with('module')->get();
        
        $token = Str::uuid()->toString();
        $verifyUrl = config('app.url') . "/api/documents/verify/{$token}";
        $qrCodeSvg = QrCode::format('svg')->size(120)->generate($verifyUrl);
        $qrCodeBase64 = base64_encode($qrCodeSvg);

        $data = [
            'student' => $student,
            'grades' => $grades,
            'year' => '2025/2026', // Ideally fetched from DB
            'date' => now()->format('d/m/Y'),
            'qrCodeBase64' => $qrCodeBase64,
            'verifyUrl' => $verifyUrl
        ];

        $filename = "student_{$student->id}_" . time() . ".pdf";
        $directory = "transcripts/year_{$academicYearId}";
        
        $path = $this->pdfEngine->generateFromView('pdf.releve_notes', $data, $directory, $filename);

        GeneratedDocument::create([
            'student_id' => $student->id,
            'document_type' => 'releve_notes',
            'file_path' => $path,
            'verification_token' => $token,
            'verification_url' => $verifyUrl,
            'expires_at' => null
        ]);

        return $path;
    }
}
