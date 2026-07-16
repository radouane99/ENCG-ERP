<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Grade;
use App\Models\Assessment;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Barryvdh\DomPDF\Facade\Pdf;

class StudentTranscriptController extends Controller
{
    /**
     * Generate PDF transcript for a student (admin access).
     */
    public function generateForAdmin(Request $request, $studentId): Response
    {
        $student = Student::with(['user', 'registrations.filiere', 'registrations.academicYear'])
            ->findOrFail($studentId);

        $pdfContent = $this->buildPdf($student, $request->query('academic_year_id'));

        $filename = 'Releve_Notes_' . strtoupper($student->user->last_name ?? 'Etudiant') . '.pdf';
        return $pdfContent->download($filename);
    }

    /**
     * Generate PDF transcript for the authenticated student.
     */
    public function generateForStudent(Request $request): Response
    {
        $user    = $request->user();
        $student = Student::with(['user', 'registrations.filiere', 'registrations.academicYear'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        $pdfContent = $this->buildPdf($student, $request->query('academic_year_id'));

        $filename = 'Releve_Notes_' . strtoupper($user->last_name ?? 'Etudiant') . '.pdf';
        return $pdfContent->download($filename);
    }

    /**
     * Build the PDF using dompdf.
     */
    private function buildPdf(Student $student, ?string $academicYearId = null)
    {
        // Find the relevant registration (latest or by academic year)
        $registration = $academicYearId
            ? $student->registrations->firstWhere('academic_year_id', $academicYearId)
            : $student->registrations->sortByDesc('id')->first();

        $filiere = $registration?->filiere;
        $academicYear = $registration?->academicYear;

        // Load all modules from this filiere
        $modules = $filiere
            ? \App\Models\Module::where('filiere_id', $filiere->id)
                ->with(['assessments'])
                ->get()
            : collect();

        // Build module-level transcript data
        $transcriptRows = $modules->map(function ($module) use ($student) {
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

            // Check rattrapage
            $rattrapageAssessment = $module->assessments->first(fn($a) => strtolower($a->type) === 'rattrapage');
            $rattrapageGrade = null;
            if ($rattrapageAssessment) {
                $rg = Grade::where('student_id', $student->id)
                    ->where('assessment_id', $rattrapageAssessment->id)
                    ->first();
                if ($rg) {
                    $rattrapageGrade = $rg->absent ? 0 : floatval($rg->value);
                }
            }

            $moyenneFinale = $moyenne;
            $decision = '–';

            if ($moyenne !== null) {
                if ($moyenne >= 10) {
                    $decision = 'Validé';
                } elseif ($moyenne < 6) {
                    $decision = 'Non Validé';
                } else {
                    $decision = 'Rattrapage';
                    if ($rattrapageGrade !== null) {
                        $moyenneFinale = max($moyenne, $rattrapageGrade);
                        $decision = $moyenneFinale >= 10 ? 'Validé (R)' : 'Non Validé';
                    }
                }
            }

            return [
                'module'          => $module->name,
                'code'            => $module->code,
                'credits'         => $module->credits ?? '–',
                'grades_detail'   => $gradesDetail,
                'moyenne'         => $moyenne,
                'rattrapage'      => $rattrapageGrade,
                'moyenne_finale'  => $moyenneFinale,
                'decision'        => $decision,
            ];
        })->filter(fn($r) => $r['moyenne'] !== null || !empty($r['grades_detail']));

        // Overall GPA
        $moyennesFinales = $transcriptRows->pluck('moyenne_finale')->filter();
        $gpa = $moyennesFinales->isNotEmpty() ? round($moyennesFinales->avg(), 2) : null;

        // Generate verification token (simple hash for QR Code)
        $verifyToken = hash('sha256', "transcript-{$student->id}-" . now()->format('Y'));

        $data = [
            'student'      => $student,
            'filiere'      => $filiere,
            'academic_year' => $academicYear,
            'rows'         => $transcriptRows->values(),
            'gpa'          => $gpa,
            'logoPath'     => public_path('logo-encg.png'),
            'verify_url'   => config('app.url') . "/verify/transcript/{$verifyToken}",
            'generated_at' => now()->format('d/m/Y à H:i'),
        ];

        return Pdf::loadView('pdf.transcript', $data)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi'                  => 150,
                'defaultFont'          => 'DejaVu Sans',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
            ]);
    }
}
