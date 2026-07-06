<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use App\Models\Student;
use App\Models\ExamSession;
use App\Services\Core\PdfEngineService;

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
        $data = [
            'student' => $student,
            'session' => $session,
            'qrCodeToken' => base64_encode("convocation_{$student->id}_{$session->id}") // Simple token for QR
        ];

        $filename = "student_{$student->id}.pdf";
        $directory = "convocations/session_{$session->id}";
        
        return $this->pdfEngine->generateFromView('pdf.convocation', $data, $directory, $filename);
    }

    /**
     * Generate an official grade transcript (Relevé de notes).
     */
    public function generateTranscript(Student $student, int $academicYearId): string
    {
        // Fetch all grades for this student and academic year
        $grades = $student->grades()->where('academic_year_id', $academicYearId)->with('module')->get();
        
        $data = [
            'student' => $student,
            'grades' => $grades,
            'year' => '2025/2026', // Ideally fetched from DB
            'date' => now()->format('d/m/Y'),
            'qrCodeToken' => base64_encode("transcript_{$student->id}_{$academicYearId}")
        ];

        $filename = "student_{$student->id}.pdf";
        $directory = "transcripts/year_{$academicYearId}";
        
        return $this->pdfEngine->generateFromView('pdf.releve_notes', $data, $directory, $filename);
    }
}
