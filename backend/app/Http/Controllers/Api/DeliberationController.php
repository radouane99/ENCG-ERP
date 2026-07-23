<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;
use App\Services\Academic\DeliberationEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliberationController extends Controller
{
    public function __construct(protected DeliberationEngine $engine)
    {
    }

    public function index(): JsonResponse
    {
        $deliberations = \App\Models\Deliberation::with(['semester', 'filiere', 'academicYear'])->get();

        $formatted = $deliberations->map(function ($delib) {
            $totalStudents = \App\Models\StudentRegistration::where('filiere_id', $delib->filiere_id)->count();
            $validatedCount = \App\Models\StudentRegistration::where('filiere_id', $delib->filiere_id)
                ->where('status', 'admin_validated')->count();
            $successRate = $totalStudents > 0 ? round(($validatedCount / $totalStudents) * 100, 1) : 0;

            return [
                'id' => $delib->id,
                'name' => 'Délibération ' . ($delib->filiere ? $delib->filiere->name : '') . ' - ' . ($delib->academicYear ? $delib->academicYear->name : ''),
                'date' => $delib->deliberation_date ? $delib->deliberation_date->format('Y-m-d') : date('Y-m-d'),
                'status' => $delib->status ?? 'completed',
                'students' => $totalStudents,
                'success_rate' => $delib->status === 'completed' ? $successRate : null,
            ];
        });

        return response()->json(['data' => $formatted]);
    }

    public function run(Request $request): JsonResponse
    {
        $semesterId = $request->query('semester', 1);
        $sessionType = $request->query('session', 'normale');
        $modules = Module::where('semester_id', $semesterId)->with('assessments')->get();

        $results = [
            'total_students' => 0,
            'admitted' => 0,
            'rattrapage' => 0,
            'ajourne' => 0,
        ];

        $students = Student::has('registrations')->get();

        foreach ($students as $student) {
            $results['total_students']++;
            $totalWeights = 0;
            $totalWeightedScore = 0;
            $needsRattrapage = false;
            $isAjourne = false;

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
                if ($sessionType === 'normale') {
                    $results['rattrapage']++;
                } else {
                    $results['ajourne']++;
                }
            } elseif ($semesterAverage < 10.0 || $needsRattrapage) {
                if ($sessionType === 'normale') {
                    $results['rattrapage']++;
                } else {
                    $results['ajourne']++;
                }
            } else {
                $results['admitted']++;
            }
        }

        return response()->json([
            'message' => 'Délibération calculée avec succès.',
            'data' => [
                'stats' => $results,
                'semester_id' => $semesterId,
                'session' => $sessionType,
            ],
        ]);
    }

    /**
     * Instant Apogée Deliberation Verdict Simulator (V, VC, RAT, ELIM, DISCIPLINE).
     */
    public function simulate(Request $request): JsonResponse
    {
        $studentId = $request->input('student_id');
        $semesterId = $request->input('semester_id', 1);

        $student = Student::findOrFail($studentId);
        $modules = Module::where('semester_id', $semesterId)->with('assessments')->get();

        $deliberation = $this->engine->calculateSemesterDeliberation($student, $modules);

        return response()->json([
            'success' => true,
            'data' => [
                'student_name' => $student->user?->name ?? 'Étudiant',
                'cne' => $student->cne ?? 'N/A',
                'semester_average' => $deliberation['semester_average'],
                'verdict' => $deliberation['decision'],
                'is_admitted' => $deliberation['is_admitted'],
                'has_eliminatory' => $deliberation['has_eliminatory'],
                'is_disciplinary' => $deliberation['is_disciplinary'],
                'modules' => $deliberation['module_results'],
            ],
        ]);
    }

    public function getStudentTranscript(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        abort_unless($student, 403, 'Profil étudiant introuvable.');

        $grades = Grade::with(['assessment.module'])
            ->where('student_id', $student->id)
            ->get();

        $rows = $grades
            ->groupBy(fn (Grade $grade) => $grade->assessment?->module?->id ?? 'unknown')
            ->map(function ($moduleGrades, $moduleId) {
                $module = $moduleGrades->first()?->assessment?->module;
                $average = round((float) $moduleGrades->avg('value'), 2);

                return [
                    'module_id' => is_numeric($moduleId) ? (int) $moduleId : null,
                    'module_name' => $module?->name ?? 'Module',
                    'coefficient' => (float) ($module?->coefficient ?? 1),
                    'result' => [
                        'average' => $average,
                        'status' => $average >= 10 ? 'V' : 'RAT',
                        'missing_grades' => false,
                    ],
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'rows' => $rows,
                'subtitle' => 'Résultats délibérés publiés',
            ],
        ]);
        public function showJury($id): JsonResponse
    {
        $delib = \App\Models\Deliberation::with(['semester', 'filiere', 'academicYear'])->findOrFail($id);
        
        $semesterId = $delib->semester_id;
        $modules = Module::where('semester_id', $semesterId)->with('assessments')->get();

        // Get students in this filiere/semester
        $students = Student::whereHas('registrations', function($q) use ($delib) {
            $q->where('filiere_id', $delib->filiere_id)
              ->where('academic_year_id', $delib->academic_year_id);
        })->get();

        $matrix = [];
        foreach ($students as $student) {
            $res = $this->engine->calculateSemesterDeliberation($student, $modules);
            
            $matrix[] = [
                'student_id' => $student->id,
                'student_name' => mb_strtoupper($student->last_name) . ' ' . $student->first_name,
                'cne' => $student->cne ?? 'N/A',
                'semester_average' => $res['semester_average'],
                'is_admitted' => $res['is_admitted'],
                'decision' => $res['decision'],
                'modules' => $res['module_results']
            ];
        }

        return response()->json([
            'deliberation' => $delib,
            'modules' => $modules->map(fn($m) => ['id' => $m->id, 'name' => $m->name, 'coef' => $m->coefficient]),
            'matrix' => $matrix
        ]);
    }

    public function applyRachat(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'module_id' => 'required|integer|exists:modules,id',
            'new_grade' => 'required|numeric|min:0|max:20'
        ]);

        // This usually consists in adding a special "Rachat" grade to the DB
        // or updating the primary assessment for that module so the average hits 10.
        // For ENCG, we find the "Exam" or "CC2" assessment for this module and update it.
        $module = Module::with('assessments')->find($validated['module_id']);
        $mainAssessment = $module->assessments()->whereIn('type', ['exam', 'examen'])->first() ?? $module->assessments()->first();

        if ($mainAssessment) {
            Grade::updateOrCreate(
                [
                    'student_id' => $validated['student_id'],
                    'assessment_id' => $mainAssessment->id
                ],
                [
                    'value' => $validated['new_grade'],
                    'absent' => false,
                    'is_rattrapage' => false
                ]
            );

            // Create a trace in logs instead of DB table to avoid migration issues
            \Illuminate\Support\Facades\Log::info("Rachat appliqué: Delib={$id}, Student={$validated['student_id']}, Module={$validated['module_id']}, NewGrade={$validated['new_grade']}, User=" . ($request->user()->id ?? 1));
        }

        return response()->json([
            'success' => true,
            'message' => 'Rachat appliqué avec succès.'
        ]);
    }

    public function exportPvPdf($id, Request $request)
    {
        $delib = \App\Models\Deliberation::with(['semester', 'filiere', 'academicYear'])->find($id);
        $type = $request->query('type', 'semestriel');
        $filiereId = $request->query('filiere_id', $delib ? $delib->filiere_id : 1);
        $academicYearId = $request->query('academic_year_id', $delib ? $delib->academic_year_id : 1);
        $semesterNum = $request->query('semester_number', $delib ? ($delib->semester ? $delib->semester->semester_number : 1) : 1);

        $delibService = new \App\Services\Academic\DeliberationService();
        $juries = $delibService->autoComposeJury($filiereId, $academicYearId, $type === 'semestriel' ? $semesterNum : null, $type);

        $filiere = \App\Models\Filiere::find($filiereId);
        $academicYear = \App\Models\AcademicYear::find($academicYearId);

        if ($type === 'annuel') {
            $matrix = $delibService->calculateAnnualCompensation($filiereId, $academicYearId);
            $modules = Module::where('filiere_id', $filiereId)->get();
            $pdfView = 'pdf.pv_annuel';
        } else {
            $pvResult = $delibService->getSemesterPVWithReservistes($filiereId, $academicYearId, $semesterNum);
            $modules = $pvResult['modules'];
            $matrix = $pvResult['matrix'];
            $pdfView = 'pdf.pv_semestriel';
        }

        $viewData = [
            'filiere' => $filiere,
            'academicYear' => $academicYear,
            'semesterNumber' => $semesterNum,
            'type' => $type,
            'modules' => $modules,
            'matrix' => $matrix,
            'juries' => $juries,
        ];

        if (view()->exists($pdfView)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($pdfView, $viewData)->setPaper('a4', 'landscape');
            return $pdf->download("pv_{$type}_filiere_{$filiereId}.pdf");
        }

        return response()->json(['message' => 'PV généré avec succès.', 'data' => $viewData]);
    }

    /**
     * Obtenir l'état de la commission du jury et des توقيعات
     */
    public function getJuryStatus(Request $request): JsonResponse
    {
        $filiereId = (int) $request->query('filiere_id', 1);
        $academicYearId = (int) $request->query('academic_year_id', 1);
        $semesterNum = $request->query('semester_number') ? (int) $request->query('semester_number') : 1;
        $type = $request->query('type', 'semestriel');

        $delibService = new \App\Services\Academic\DeliberationService();
        $juries = $delibService->autoComposeJury($filiereId, $academicYearId, $type === 'semestriel' ? $semesterNum : null, $type);

        $totalMembers = count($juries);
        $signedCount = collect($juries)->where('status', 'signed')->count();

        return response()->json([
            'success' => true,
            'type' => $type,
            'total_members' => $totalMembers,
            'signed_count' => $signedCount,
            'members' => $juries
        ]);
    }

    /**
     * Signer le PV par un membre du jury
     */
    public function signJury(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'jury_id' => 'required|integer',
            'signature_data' => 'required|string',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $delibService = new \App\Services\Academic\DeliberationService();
        $result = $delibService->signJuryPv($validated['jury_id'], $user->id, $validated['signature_data'], $request->ip());

        if ($result['status'] === 'error') {
            return response()->json(['message' => $result['message']], 404);
        }

        return response()->json([
            'message' => 'Tsignature enregistrée avec succès.',
            'digital_seal' => $result['digital_seal'],
            'signed_at' => $result['signed_at']
        ]);
    }

    /**
     * Récupérer les résultats de compensation annuelle (S1+S2)
     */
    public function getAnnualCompensation(Request $request): JsonResponse
    {
        $filiereId = (int) $request->query('filiere_id', 1);
        $academicYearId = (int) $request->query('academic_year_id', 1);

        $delibService = new \App\Services\Academic\DeliberationService();
        $results = $delibService->calculateAnnualCompensation($filiereId, $academicYearId);

        return response()->json(['data' => $results]);
    }
}}
