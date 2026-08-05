<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deliberation;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Models\Filiere;
use App\Models\AcademicYear;
use App\Services\Academic\DeliberationEngine;
use App\Services\Academic\DeliberationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class DeliberationController extends Controller
{
    public function __construct(
        private DeliberationEngine $engine,
        private DeliberationService $deliberationService
    ) {}

    /**
     * Liste des délibérations.
     */
    public function index(): JsonResponse
    {
        $deliberations = Deliberation::with(['semester', 'filiere', 'academicYear'])->get();

        $formatted = $deliberations->map(function ($delib) {
            $totalStudents = StudentRegistration::where('filiere_id', $delib->filiere_id)->count();
            $validatedCount = StudentRegistration::where('filiere_id', $delib->filiere_id)
                ->where('status', 'admin_validated')->count();
            $successRate = $totalStudents > 0 ? round(($validatedCount / $totalStudents) * 100, 1) : 0;

            return [
                'id'           => $delib->id,
                'name'         => 'Délibération ' . ($delib->filiere?->name ?? '') . ' - ' . ($delib->academicYear?->name ?? ''),
                'date'         => $delib->deliberation_date?->format('Y-m-d') ?? date('Y-m-d'),
                'status'       => $delib->status ?? 'completed',
                'students'     => $totalStudents,
                'success_rate' => $delib->status === 'completed' ? $successRate : null,
            ];
        });

        return response()->json(['data' => $formatted]);
    }

    /**
     * Lancer la délibération.
     */
    public function run(Request $request): JsonResponse
    {
        $semesterId  = $request->query('semester', 1);
        $sessionType = $request->query('session', 'normale');
        $modules     = Module::where('semester_id', $semesterId)->with('assessments')->get();

        $results = ['total_students' => 0, 'admitted' => 0, 'rattrapage' => 0, 'ajourne' => 0];
        $students = Student::has('registrations')->get();

        foreach ($students as $student) {
            $results['total_students']++;
            $totalWeights       = 0;
            $totalWeightedScore = 0;
            $needsRattrapage    = false;
            $isAjourne          = false;

            foreach ($modules as $module) {
                $moduleResult = $this->engine->calculateModuleResult($student, $module);

                if ($moduleResult['status'] === 'NV') {
                    $isAjourne = true;
                } elseif ($moduleResult['status'] === 'RAT') {
                    $needsRattrapage = true;
                }

                $weight = $module->coefficient ?? 1.0;
                $totalWeightedScore += ($moduleResult['average'] * $weight);
                $totalWeights += $weight;
            }

            $semesterAverage = $totalWeights > 0 ? ($totalWeightedScore / $totalWeights) : 0;

            if ($isAjourne) {
                $sessionType === 'normale' ? $results['rattrapage']++ : $results['ajourne']++;
            } elseif ($semesterAverage < 10.0 || $needsRattrapage) {
                $sessionType === 'normale' ? $results['rattrapage']++ : $results['ajourne']++;
            } else {
                $results['admitted']++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Délibération calculée avec succès.',
            'data'    => [
                'stats'       => $results,
                'semester_id' => $semesterId,
                'session'     => $sessionType,
            ],
        ]);
    }

    /**
     * Simulateur de verdict de délibération.
     */
    public function simulate(Request $request): JsonResponse
    {
        $studentId  = $request->input('student_id');
        $semesterId = $request->input('semester_id', 1);

        $student      = Student::findOrFail($studentId);
        $modules      = Module::where('semester_id', $semesterId)->with('assessments')->get();
        $deliberation = $this->engine->calculateSemesterDeliberation($student, $modules);

        return response()->json([
            'success' => true,
            'data'    => [
                'student_name'      => $student->user?->name ?? 'Étudiant',
                'cne'               => $student->cne ?? 'N/A',
                'semester_average'  => $deliberation['semester_average'],
                'verdict'           => $deliberation['decision'],
                'is_admitted'       => $deliberation['is_admitted'],
                'has_eliminatory'   => $deliberation['has_eliminatory'],
                'is_disciplinary'   => $deliberation['is_disciplinary'],
                'modules'           => $deliberation['module_results'],
            ],
        ]);
    }

    /**
     * Relevé de notes étudiant.
     */
    public function getStudentTranscript(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        abort_unless($student, 403, 'Profil étudiant introuvable.');

        $grades = Grade::with(['assessment.module'])
            ->where('student_id', $student->id)
            ->get();

        $rows = $grades
            ->groupBy(fn(Grade $grade) => $grade->assessment?->module?->id ?? 'unknown')
            ->map(function ($moduleGrades) {
                $module  = $moduleGrades->first()?->assessment?->module;
                $average = round((float) $moduleGrades->avg('value'), 2);

                return [
                    'module_id'   => is_numeric($moduleGrades->first()?->assessment?->module?->id) ? (int) $moduleGrades->first()->assessment->module->id : null,
                    'module_name' => $module?->name ?? 'Module',
                    'coefficient' => (float) ($module?->coefficient ?? 1),
                    'result'      => [
                        'average'        => $average,
                        'status'         => $average >= 10 ? 'V' : 'RAT',
                        'missing_grades' => false,
                    ],
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data'    => ['rows' => $rows, 'subtitle' => 'Résultats délibérés publiés'],
        ]);
    }

    /**
     * Afficher le jury d'une délibération.
     */
    public function showJury(int $id): JsonResponse
    {
        $delib = Deliberation::with(['semester', 'filiere', 'academicYear'])->findOrFail($id);

        $modules  = Module::where('semester_id', $delib->semester_id)->with('assessments')->get();
        $students = Student::whereHas('registrations', function ($q) use ($delib) {
            $q->where('filiere_id', $delib->filiere_id)
              ->where('academic_year_id', $delib->academic_year_id);
        })->get();

        $matrix = [];
        foreach ($students as $student) {
            $res = $this->engine->calculateSemesterDeliberation($student, $modules);
            $matrix[] = [
                'student_id'       => $student->id,
                'student_name'     => mb_strtoupper($student->last_name) . ' ' . $student->first_name,
                'cne'              => $student->cne ?? 'N/A',
                'semester_average' => $res['semester_average'],
                'is_admitted'      => $res['is_admitted'],
                'decision'         => $res['decision'],
                'modules'          => $res['module_results'],
            ];
        }

        return response()->json([
            'deliberation' => $delib,
            'modules'      => $modules->map(fn($m) => ['id' => $m->id, 'name' => $m->name, 'coef' => $m->coefficient]),
            'matrix'       => $matrix,
        ]);
    }

    /**
     * Appliquer un rachat de note.
     */
    public function applyRachat(Request $request, int $id = 0): JsonResponse
    {
        $validated = $request->validate([
            'student_id'    => 'required|integer|exists:students,id',
            'filiere_id'    => 'nullable|integer',
            'semester'      => 'nullable|integer',
            'points_added'  => 'nullable|numeric',
            'reason'        => 'nullable|string|max:1000',
            // optional detailed fields
            'module_id'     => 'nullable|integer',
            'new_grade'     => 'nullable|numeric|min:0|max:20',
        ]);

        $student   = Student::find($validated['student_id']);
        $filiereId = $validated['filiere_id'] ?? 1;
        $semester  = $validated['semester']    ?? 1;
        $reason    = $validated['reason']      ?? 'Rattrapage accordé par le Jury de Délibération';

        // If module_id + new_grade provided, apply the grade update
        if (!empty($validated['module_id']) && isset($validated['new_grade'])) {
            $module = Module::with('assessments')->find($validated['module_id']);
            $mainAssessment = $module?->assessments()
                ->whereIn('type', ['exam', 'examen'])
                ->first() ?? $module?->assessments()->first();

            if ($mainAssessment) {
                Grade::updateOrCreate(
                    ['student_id' => $validated['student_id'], 'assessment_id' => $mainAssessment->id],
                    ['value' => $validated['new_grade'], 'absent' => false]
                );
            }
        }

        $pvToken = md5("rachat_{$validated['student_id']}_{$filiereId}_{$semester}_" . now()->timestamp);

        Log::info('Rattrapage appliqué', [
            'student_id'  => $validated['student_id'],
            'filiere_id'  => $filiereId,
            'semester'    => $semester,
            'points'      => $validated['points_added'] ?? null,
            'reason'      => $reason,
            'user_id'     => $request->user()?->id,
            'ip'          => $request->ip(),
            'pv_token'    => $pvToken,
        ]);

        $pvUrl = url("/api/deliberations/export-pv-rachat?student_id={$validated['student_id']}&filiere_id={$filiereId}&semester={$semester}&points={$validated['points_added']}&reason=" . urlencode($reason) . "&token={$pvToken}");

        return response()->json([
            'success'           => true,
            'message'           => 'Rachat appliqué avec succès. Le PV de Rachat est prêt à être signé.',
            'pv_rattrapage_url' => $pvUrl,
        ]);
    }

    /**
     * Générer le PV de Rattrapage officiel (PDF signable).
     */
    public function exportRattrapage(Request $request)
    {
        $studentId = (int) $request->query('student_id', 0);
        $filiereId = (int) $request->query('filiere_id', 1);
        $semester  = (int) $request->query('semester', 1);
        $points    = (float) $request->query('points', 0);
        $reason    = $request->query('reason', 'Rattrapage accordé par le Jury de Délibération');

        $student   = Student::find($studentId);
        $filiere   = Filiere::find($filiereId);

        $academicYear = AcademicYear::where('is_active', true)->first()
            ?? AcademicYear::orderByDesc('id')->first();

        $viewData = [
            'student'       => $student,
            'filiere'       => $filiere,
            'academic_year' => $academicYear,
            'semester'      => $semester,
            'points_added'  => $points,
            'reason'        => $reason,
            'generated_at'  => now()->format('d/m/Y à H:i'),
            'generated_by'  => $request->user()?->name ?? 'Administration',
        ];

        $pdf = Pdf::loadView('pdf.pv_rachat', $viewData)->setPaper('a4', 'portrait');
        $fileName = "PV_Rachat_{$student?->cne}_{$filiere?->code}_S{$semester}.pdf";
        return $pdf->download($fileName);
    }

    /**
     * Exporter le PV en PDF (semestriel ou annuel).
     */
    public function exportPvPdf(int $id, Request $request)
    {
        $delib          = Deliberation::with(['semester', 'filiere', 'academicYear'])->find($id);
        $type           = $request->query('type', 'semestriel');
        $filiereId      = $request->query('filiere_id', $delib?->filiere_id ?? 1);
        $academicYearId = $request->query('academic_year_id', $delib?->academic_year_id ?? 1);
        $semesterNum    = $request->query('semester_number', $delib?->semester?->semester_number ?? 1);

        $juries = $this->deliberationService->autoComposeJury($filiereId, $academicYearId, $type === 'semestriel' ? $semesterNum : null, $type);

        $filiere      = Filiere::find($filiereId);
        $academicYear = AcademicYear::find($academicYearId);

        if ($type === 'annuel') {
            $matrix  = $this->deliberationService->calculateAnnualCompensation($filiereId, $academicYearId);
            $modules = Module::where('filiere_id', $filiereId)->get();
            $pdfView = 'pdf.pv_annuel';
        } else {
            $pvResult = $this->deliberationService->getSemesterPVWithReservistes($filiereId, $academicYearId, $semesterNum);
            $modules  = $pvResult['modules'];
            $matrix   = $pvResult['matrix'];
            $pdfView  = 'pdf.pv_semestriel';
        }

        $viewData = compact('filiere', 'academicYear', 'semesterNum', 'type', 'modules', 'matrix', 'juries');

        if (view()->exists($pdfView)) {
            $pdf = Pdf::loadView($pdfView, $viewData)->setPaper('a4', 'landscape');
            return $pdf->download("pv_{$type}_filiere_{$filiereId}.pdf");
        }

        return response()->json(['message' => 'PV généré avec succès.', 'data' => $viewData]);
    }

    /**
     * Statut du jury.
     */
    public function getJuryStatus(Request $request): JsonResponse
    {
        $filiereId      = (int) $request->query('filiere_id', 1);
        $academicYearId = (int) $request->query('academic_year_id', 1);
        $semesterNum    = (int) $request->query('semester_number', 1);
        $type           = $request->query('type', 'semestriel');

        $juries = $this->deliberationService->autoComposeJury($filiereId, $academicYearId, $type === 'semestriel' ? $semesterNum : null, $type);

        $totalMembers = count($juries);
        $signedCount  = collect($juries)->where('status', 'signed')->count();

        return response()->json([
            'success'       => true,
            'type'          => $type,
            'total_members' => $totalMembers,
            'signed_count'  => $signedCount,
            'members'       => $juries,
        ]);
    }

    /**
     * Signer le PV par un membre du jury.
     */
    public function signJury(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'jury_id'        => 'required|integer',
            'signature_data' => 'required|string',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $result = $this->deliberationService->signJuryPv(
            $validated['jury_id'],
            $user->id,
            $validated['signature_data'],
            $request->ip()
        );

        if ($result['status'] === 'error') {
            return response()->json(['message' => $result['message']], 404);
        }

        return response()->json([
            'message'      => 'Signature enregistrée avec succès.',
            'digital_seal' => $result['digital_seal'],
            'signed_at'    => $result['signed_at'],
        ]);
    }

    /**
     * Compensation annuelle (S1+S2).
     */
    public function getAnnualCompensation(Request $request): JsonResponse
    {
        $filiereId      = (int) $request->query('filiere_id', 1);
        $academicYearId = (int) $request->query('academic_year_id', 1);
        $yearLevel      = (int) $request->query('year_level', 1);

        $results = $this->deliberationService->calculateAnnualCompensation($filiereId, $academicYearId, $yearLevel);

        return response()->json(['data' => $results]);
    }
}