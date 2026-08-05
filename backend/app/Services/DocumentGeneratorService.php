<?php

namespace App\Services;

use App\Models\ExamSession;
use App\Models\GeneratedDocument;
use App\Models\Student;
use App\Services\Core\PdfEngineService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class DocumentGeneratorService
{
    public function __construct(
        private PdfEngineService $pdfEngine
    ) {}

    /**
     * Logo ENCG en Base64.
     */
    private function getLogoBase64(): string
    {
        $path = public_path('images/encg_logo.png');
        if (file_exists($path)) {
            return 'data:image/' . pathinfo($path, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($path));
        }
        return '';
    }

    /**
     * Générer une convocation d'examen PDF.
     */
    public function generateConvocation(
        Student $student,
        ExamSession $session,
        string $signatoryTitle = "LE DIRECTEUR DE L'ENCG FÈS",
        ?string $signatureBase64 = null
    ): string {
        $token     = Str::uuid()->toString();
        $verifyUrl = config('app.url') . "/api/documents/verify/{$token}";
        $qrBase64  = 'data:image/svg+xml;base64,' . base64_encode(QrCode::format('svg')->size(120)->generate($verifyUrl));

        $data = [
            'student'         => $student,
            'session'         => $session,
            'qrBase64'        => $qrBase64,
            'logoBase64'      => $this->getLogoBase64(),
            'verifyUrl'       => $verifyUrl,
            'signatoryTitle'  => $signatoryTitle,
            'signatureBase64' => $signatureBase64,
        ];

        $filename  = "student_{$student->id}_" . time() . ".pdf";
        $directory = "convocations/session_{$session->id}";
        $path      = $this->pdfEngine->generateFromView('pdf.convocation', $data, $directory, $filename);

        GeneratedDocument::create([
            'student_id'          => $student->id,
            'document_type'       => 'convocation',
            'file_path'           => $path,
            'verification_token'  => $token,
            'verification_url'    => $verifyUrl,
        ]);

        return $path;
    }

    /**
     * Générer un relevé de notes PDF.
     */
    public function generateTranscript(
        Student $student,
        int $academicYearId,
        string $signatoryTitle = "LE DIRECTEUR DE L'ENCG FÈS",
        ?string $signatureBase64 = null
    ): string {
        $grades = $student->grades()->with(['assessment.module'])->get();

        $formattedModules = [];
        $totalScore = 0;
        $totalCoef  = 0;

        foreach ($grades as $grade) {
            if (!$grade->assessment?->module) continue;

            $module = $grade->assessment->module;
            $score  = $grade->value;
            $coef   = $module->coefficient ?? 1;

            $formattedModules[] = [
                'code'         => $module->code ?? 'N/A',
                'name'         => $module->name,
                'score'        => $score,
                'is_validated' => $score >= 10,
            ];

            $totalScore += ($score * $coef);
            $totalCoef  += $coef;
        }

        $avgGrade = $totalCoef > 0 ? ($totalScore / $totalCoef) : 0;

        $token     = Str::uuid()->toString();
        $verifyUrl = config('app.url') . "/api/documents/verify/{$token}";
        $qrBase64  = 'data:image/svg+xml;base64,' . base64_encode(QrCode::format('svg')->size(120)->generate($verifyUrl));

        $data = [
            'student'         => $student,
            'modules'         => $formattedModules,
            'avgGrade'        => $avgGrade,
            'year'            => config('app.academic_year', '2025/2026'),
            'date'            => now()->format('d/m/Y'),
            'qrBase64'        => $qrBase64,
            'logoBase64'      => $this->getLogoBase64(),
            'verifyUrl'       => $verifyUrl,
            'signatoryTitle'  => $signatoryTitle,
            'signatureBase64' => $signatureBase64,
        ];

        $filename  = "student_{$student->id}_" . time() . ".pdf";
        $directory = "transcripts/year_{$academicYearId}";
        $path      = $this->pdfEngine->generateFromView('pdf.releve_notes', $data, $directory, $filename);

        GeneratedDocument::create([
            'student_id'          => $student->id,
            'document_type'       => 'releve_notes',
            'file_path'           => $path,
            'verification_token'  => $token,
            'verification_url'    => $verifyUrl,
        ]);

        return $path;
    }
}