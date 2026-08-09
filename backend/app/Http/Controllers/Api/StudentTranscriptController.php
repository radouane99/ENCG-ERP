<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class StudentTranscriptController extends Controller
{
    /**
     * Relevé de notes PDF (admin).
     */
    public function generateForAdmin(Request $request, string $studentId)
    {
        $student = Student::with(['user', 'registrations.filiere', 'registrations.academicYear'])
            ->where(function ($q) use ($studentId) {
                if (is_numeric($studentId)) {
                    $q->where('id', (int) $studentId)->orWhere('uuid', $studentId);
                } else {
                    $q->where('uuid', $studentId);
                }
            })
            ->firstOrFail();

        return $this->generatePdfResponse(
            $student,
            $request->query('academic_year_id'),
            $request->query('semester', 'all')
        );
    }

    /**
     * Relevé de notes PDF (étudiant connecté).
     */
    public function generateForStudent(Request $request)
    {
        $student = Student::with(['user', 'registrations.filiere', 'registrations.academicYear'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return $this->generatePdfResponse(
            $student,
            $request->query('academic_year_id'),
            $request->query('semester', 'all')
        );
    }

    /**
     * Génère la réponse PDF.
     */
    private function generatePdfResponse(Student $student, ?string $academicYearId, string $semester)
    {
        $docType = \App\Models\DocumentType::where('code', 'REL_NOTES')->first()
            ?? \App\Models\DocumentType::firstOrCreate(
                ['code' => 'REL_NOTES'],
                ['name' => 'Relevé de Notes', 'view_name' => 'documents.releve_notes', 'is_active' => true]
            );

        $docRequest = \App\Models\DocumentRequest::create([
            'student_id'       => $student->id,
            'document_type_id' => $docType->id,
            'status'           => 'ready',
            'requested_at'     => now(),
            'processed_at'     => now(),
        ]);

        $docService = app(\App\Services\DocumentRequestService::class);
        $genDoc = $docService->generateDocumentPdf($docRequest);

        $fullPath = null;
        if (Storage::disk('private')->exists($genDoc->file_path)) {
            $fullPath = Storage::disk('private')->path($genDoc->file_path);
        } elseif (Storage::disk('local')->exists($genDoc->file_path)) {
            $fullPath = Storage::disk('local')->path($genDoc->file_path);
        } elseif (file_exists(storage_path('app/' . $genDoc->file_path))) {
            $fullPath = storage_path('app/' . $genDoc->file_path);
        }

        if ($fullPath && file_exists($fullPath)) {
            return response()->file($fullPath, [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'inline; filename="Releve_Notes_' . strtoupper($student->user?->last_name ?? 'Etudiant') . '.pdf"',
            ]);
        }

        return response('Erreur lors de la génération du PDF', 500);
    }

    /**
     * Construit le PDF du relevé de notes.
     */
    private function buildPdf(Student $student, ?string $academicYearId, string $semester): Pdf
    {
        $registration = $academicYearId
            ? $student->registrations->firstWhere('academic_year_id', $academicYearId)
            : $student->registrations->sortByDesc('id')->first();

        $filiere      = $registration?->filiere;
        $academicYear = $registration?->academicYear;

        $modules = $this->getModulesForTranscript($filiere, $semester);
        $transcriptRows = $this->buildTranscriptRows($student, $modules);

        $gpa = $this->calculateGpa($transcriptRows);

        $verifyToken = hash('sha256', "transcript-{$student->id}-" . now()->format('Y-m-d'));
        $verifyUrl   = config('app.url', 'http://localhost:8000') . "/verify/transcript/{$verifyToken}";

        $qrBase64 = base64_encode(QrCode::size(150)->generate($verifyUrl));
        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : '';

        return Pdf::loadView('pdf.transcript', [
            'student'       => $student,
            'filiere'       => $filiere,
            'academic_year' => $academicYear,
            'semester'      => strtoupper($semester),
            'rows'          => $transcriptRows->values(),
            'gpa'           => $gpa,
            'logoBase64'    => $logoBase64,
            'qrBase64'      => $qrBase64,
            'verify_url'    => $verifyUrl,
            'generated_at'  => now()->format('d/m/Y à H:i'),
        ])
        ->setPaper('a4', 'portrait')
        ->setOptions([
            'dpi'                  => 150,
            'defaultFont'          => 'DejaVu Sans',
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled'      => true,
        ]);
    }

    /**
     * Récupère les modules pour le relevé.
     */
    private function getModulesForTranscript($filiere, string $semester)
    {
        if (!$filiere) return collect();

        $query = Module::where('filiere_id', $filiere->id)->with(['assessments']);

        if ($semester !== 'all') {
            $query->where(function ($q) use ($semester) {
                $q->where('code', 'LIKE', "%{$semester}%")
                  ->orWhere('name', 'LIKE', "%{$semester}%");
            });
        }

        return $query->get();
    }

    /**
     * Construit les lignes du relevé pour un étudiant.
     */
    private function buildTranscriptRows(Student $student, $modules)
    {
        return $modules->map(function ($module) use ($student) {
            $assessments = $module->assessments->where('type', '!=', 'Rattrapage');

            $totalWeight  = 0;
            $weightedSum  = 0;
            $gradesDetail = [];

            foreach ($assessments as $assessment) {
                $grade = Grade::where('student_id', $student->id)
                    ->where('assessment_id', $assessment->id)
                    ->first();

                $val     = $grade?->value;
                $absent  = $grade?->absent ?? false;
                $calcVal = $absent ? 0 : ($val !== null ? floatval($val) : null);

                $gradesDetail[$assessment->type] = [
                    'value'  => $val,
                    'absent' => $absent,
                    'weight' => $assessment->weight,
                ];

                if ($calcVal !== null) {
                    $weightedSum += $calcVal * ($assessment->weight / 100);
                    $totalWeight += $assessment->weight;
                }
            }

            $moyenne = $totalWeight > 0 ? round($weightedSum * (100 / $totalWeight), 2) : null;

            $rattrapageGrade = $this->getRattrapageGrade($student, $module);
            $moyenneFinale   = $moyenne;
            $decision        = $this->determineTranscriptDecision($moyenne, $rattrapageGrade, $moyenneFinale);

            return [
                'module'         => $module->name,
                'code'           => $module->code,
                'credits'        => $module->credits ?? '–',
                'grades_detail'  => $gradesDetail,
                'moyenne'        => $moyenne,
                'rattrapage'     => $rattrapageGrade,
                'moyenne_finale' => $moyenneFinale,
                'decision'       => $decision,
            ];
        })->filter(fn($r) => $r['moyenne'] !== null || !empty($r['grades_detail']));
    }

    /**
     * Récupère la note de rattrapage.
     */
    private function getRattrapageGrade(Student $student, Module $module): ?float
    {
        $rattrapageAssessment = $module->assessments->first(
            fn($a) => strtolower($a->type) === 'rattrapage'
        );

        if (!$rattrapageAssessment) return null;

        $rg = Grade::where('student_id', $student->id)
            ->where('assessment_id', $rattrapageAssessment->id)
            ->first();

        return $rg ? ($rg->absent ? 0 : floatval($rg->value)) : null;
    }

    /**
     * Détermine la décision du relevé.
     */
    private function determineTranscriptDecision(?float $moyenne, ?float $rattrapageGrade, ?float &$moyenneFinale): string
    {
        if ($moyenne === null) return '–';

        if ($moyenne >= 10) return 'Validé';

        if ($rattrapageGrade !== null) {
            $rawAverage = max($moyenne, $rattrapageGrade);
            if ($rawAverage >= 10) {
                $moyenneFinale = min(12.00, round($rawAverage, 2));
                return 'Validé (R)';
            }
            $moyenneFinale = round($rawAverage, 2);
            return 'Non Validé';
        }

        if ($moyenne < 6) return 'Non Validé';

        return 'Rattrapage';
    }

    /**
     * Calcule la moyenne générale (GPA).
     */
    private function calculateGpa($transcriptRows): ?float
    {
        $moyennes = $transcriptRows->pluck('moyenne_finale')->filter();
        return $moyennes->isNotEmpty() ? round($moyennes->avg(), 2) : null;
    }
}