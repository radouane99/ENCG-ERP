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
     * Helper to load the ENCG logo in Base64 for DomPDF.
     */
    private function getLogoBase64(): string
    {
        $path = public_path('images/encg_logo.png');
        if (file_exists($path)) {
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            return 'data:image/' . $type . ';base64,' . base64_encode($data);
        }
        return '';
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
            'qrBase64' => 'data:image/svg+xml;base64,' . $qrCodeBase64,
            'logoBase64' => $this->getLogoBase64(),
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
        // Fetch all grades for this student. Ideally, we should join with assessments to filter by academic_year_id
        // but for simplicity we fetch all their grades for now or filter through assessment.
        $grades = $student->grades()
            ->whereHas('assessment', function ($query) use ($academicYearId) {
                $query->where('academic_year_id', $academicYearId);
            })
            ->with(['assessment.module'])
            ->get();
        
        $token = Str::uuid()->toString();
        $verifyUrl = config('app.url') . "/api/documents/verify/{$token}";
        $qrCodeSvg = QrCode::format('svg')->size(120)->generate($verifyUrl);
        $qrCodeBase64 = base64_encode($qrCodeSvg);

        $data = [
            'student' => $student,
            'grades' => $grades,
            'year' => '2025/2026', // Ideally fetched from DB
            'date' => now()->format('d/m/Y'),
            'qrBase64' => 'data:image/svg+xml;base64,' . $qrCodeBase64,
            'logoBase64' => $this->getLogoBase64(),
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
