<?php

namespace App\Http\Controllers\Api;

use App\Domain\AI\Services\GroundedAiService;
use App\Domain\Deliberation\LmdRules;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Deliberation;
use App\Models\DisciplinaryCase;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Services\Academic\DeliberationEngine;
use App\Services\Academic\DeliberationSealService;
use App\Services\Academic\DeliberationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class DeliberationController extends Controller
{
    public function __construct(
        private DeliberationEngine $engine,
        private DeliberationService $deliberationService,
        private GroundedAiService $groundedAi
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
                'id' => $delib->id,
                'name' => 'Délibération '.($delib->filiere?->name ?? '').' - '.($delib->academicYear?->name ?? ''),
                'date' => $delib->deliberation_date?->format('Y-m-d') ?? date('Y-m-d'),
                'status' => $delib->status ?? 'completed',
                'students' => $totalStudents,
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
        $semesterId = $request->query('semester', 1);
        $sessionType = $request->query('session', 'normale');
        $modules = Module::where('semester_id', $semesterId)->with('assessments')->get();

        $results = ['total_students' => 0, 'admitted' => 0, 'rattrapage' => 0, 'ajourne' => 0];
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
            'data' => [
                'stats' => $results,
                'semester_id' => $semesterId,
                'session' => $sessionType,
            ],
        ]);
    }

    /**
     * Simulateur de verdict de délibération.
     */
    public function simulate(Request $request): JsonResponse
    {
        $studentId = $request->input('student_id');
        $semesterId = $request->input('semester_id', 1);

        $student = Student::findOrFail($studentId);
        $modules = Module::where('semester_id', $semesterId)->with('assessments')->get();
        $deliberation = $this->engine->calculateSemesterDeliberation($student, $modules);

        $payload = [
            'student_name' => $student->user?->name ?? 'Étudiant',
            'cne' => $student->cne ?? 'N/A',
            'semester_average' => $deliberation['semester_average'],
            'verdict' => $deliberation['decision'],
            'is_admitted' => $deliberation['is_admitted'],
            'has_eliminatory' => $deliberation['has_eliminatory'],
            'is_disciplinary' => $deliberation['is_disciplinary'],
            'modules' => $deliberation['module_results'],
        ];

        if ($request->boolean('explain')) {
            $copy = $this->groundedAi->explain([
                'verdict' => $deliberation['is_admitted'] ? 'V' : 'RAT',
                'semester_average' => $deliberation['semester_average'],
                'has_eliminatory' => $deliberation['has_eliminatory'],
                'eliminatory_threshold' => LmdRules::ELIMINATORY_THRESHOLD,
                'validation_threshold' => LmdRules::VALIDATION_THRESHOLD,
            ], 'lmd_judge');
            $payload['text_fr'] = $copy['text_fr'];
            $payload['text_ar'] = $copy['text_ar'];
        }

        return response()->json([
            'success' => true,
            'data' => $payload,
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
            ->groupBy(fn (Grade $grade) => $grade->assessment?->module?->id ?? 'unknown')
            ->map(function ($moduleGrades) {
                $module = $moduleGrades->first()?->assessment?->module;
                $average = round((float) $moduleGrades->avg('value'), 2);

                return [
                    'module_id' => is_numeric($moduleGrades->first()?->assessment?->module?->id) ? (int) $moduleGrades->first()->assessment->module->id : null,
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
            'data' => ['rows' => $rows, 'subtitle' => 'Résultats délibérés publiés'],
        ]);
    }

    /**
     * Afficher le jury d'une délibération.
     */
    public function showJury(int $id): JsonResponse
    {
        $delib = Deliberation::with(['semester', 'filiere', 'academicYear'])->findOrFail($id);

        $modules = Module::where('semester_id', $delib->semester_id)->with('assessments')->get();
        $students = Student::whereHas('registrations', function ($q) use ($delib) {
            $q->where('filiere_id', $delib->filiere_id)
                ->where('academic_year_id', $delib->academic_year_id);
        })->get();

        $matrix = [];
        foreach ($students as $student) {
            $res = $this->engine->calculateSemesterDeliberation($student, $modules);
            $matrix[] = [
                'student_id' => $student->id,
                'student_name' => mb_strtoupper($student->last_name).' '.$student->first_name,
                'cne' => $student->cne ?? 'N/A',
                'semester_average' => $res['semester_average'],
                'is_admitted' => $res['is_admitted'],
                'decision' => $res['decision'],
                'modules' => $res['module_results'],
            ];
        }

        return response()->json([
            'deliberation' => $delib,
            'is_sealed' => (bool) $delib->is_sealed,
            'modules' => $modules->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'coef' => $m->coefficient]),
            'matrix' => $matrix,
        ]);
    }

    public function aiBrief(int $id): JsonResponse
    {
        $delib = Deliberation::with(['semester', 'filiere', 'academicYear'])->findOrFail($id);
        if ($delib->is_sealed) {
            return response()->json([
                'success' => false,
                'disabled' => true,
                'message' => 'Le PV est scellé : le brief IA est désactivé.',
            ], 423);
        }

        $modules = Module::where('semester_id', $delib->semester_id)->with('assessments')->get();
        $students = Student::whereHas('registrations', function ($q) use ($delib) {
            $q->where('filiere_id', $delib->filiere_id)
                ->where('academic_year_id', $delib->academic_year_id);
        })->get();

        $below = 0;
        $rachat = 0;
        $rat = 0;
        foreach ($students as $student) {
            $res = $this->engine->calculateSemesterDeliberation($student, $modules);
            $avg = (float) ($res['semester_average'] ?? 0);
            if ($res['has_eliminatory'] || $avg < LmdRules::ELIMINATORY_THRESHOLD) {
                $below++;
            }
            if ($avg >= LmdRules::RACHAT_MIN_AVERAGE && $avg < LmdRules::VALIDATION_THRESHOLD) {
                $rachat++;
            }
            if (! ($res['is_admitted'] ?? false) && $avg >= LmdRules::ELIMINATORY_THRESHOLD) {
                $rat++;
            }
        }

        $discipline = DisciplinaryCase::query()
            ->whereIn('student_id', $students->pluck('id'))
            ->count();

        $facts = [
            'headcount' => $students->count(),
            'below_eliminatory' => $below,
            'rachat_band' => $rachat,
            'rat_count' => $rat,
            'discipline_cases' => $discipline,
            'eliminatory_threshold' => LmdRules::ELIMINATORY_THRESHOLD,
        ];
        $copy = $this->groundedAi->explain($facts, 'jury_brief');

        return response()->json([
            'success' => true,
            'facts' => $facts,
            'text_fr' => $copy['text_fr'],
            'text_ar' => $copy['text_ar'],
            'disclaimer' => 'L’IA ne vote pas et ne scelle pas le PV.',
        ]);
    }

    /**
     * Appliquer un rachat de note.
     */
    public function applyRachat(Request $request, int $id = 0): JsonResponse
    {
        if ($id) {
            app(DeliberationSealService::class)->assertNotSealed(Deliberation::findOrFail($id));
        }

        $validated = $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'filiere_id' => 'nullable|integer',
            'semester' => 'nullable|integer',
            'points_added' => 'nullable|numeric',
            'reason' => 'nullable|string|max:1000',
            // optional detailed fields
            'module_id' => 'nullable|integer',
            'new_grade' => 'nullable|numeric|min:0|max:20',
        ]);

        $student = Student::find($validated['student_id']);
        $filiereId = $validated['filiere_id'] ?? 1;
        $semester = $validated['semester'] ?? 1;
        $reason = $validated['reason'] ?? 'Rattrapage accordé par le Jury de Délibération';

        // If module_id + new_grade provided, apply the grade update
        if (! empty($validated['module_id']) && isset($validated['new_grade'])) {
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

        $pvToken = md5("rachat_{$validated['student_id']}_{$filiereId}_{$semester}_".now()->timestamp);

        Log::info('Rattrapage appliqué', [
            'student_id' => $validated['student_id'],
            'filiere_id' => $filiereId,
            'semester' => $semester,
            'points' => $validated['points_added'] ?? null,
            'reason' => $reason,
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'pv_token' => $pvToken,
        ]);

        $pvUrl = url("/api/deliberations/export-pv-rachat?student_id={$validated['student_id']}&filiere_id={$filiereId}&semester={$semester}&points={$validated['points_added']}&reason=".urlencode($reason)."&token={$pvToken}");

        return response()->json([
            'success' => true,
            'message' => 'Rachat appliqué avec succès. Le PV de Rachat est prêt à être signé.',
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
        $semester = (int) $request->query('semester', 1);
        $points = (float) $request->query('points', 0);
        $reason = $request->query('reason', 'Rattrapage accordé par le Jury de Délibération');

        $student = Student::find($studentId);
        $filiere = Filiere::find($filiereId);

        $academicYear = AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::orderByDesc('id')->first();

        $viewData = [
            'student' => $student,
            'filiere' => $filiere,
            'academic_year' => $academicYear,
            'semester' => $semester,
            'points_added' => $points,
            'reason' => $reason,
            'generated_at' => now()->format('d/m/Y à H:i'),
            'generated_by' => $request->user()?->name ?? 'Administration',
        ];

        $pdf = Pdf::loadView('pdf.pv_rachat', $viewData)->setPaper('a4', 'portrait');
        $fileName = "PV_Rachat_{$student?->cne}_{$filiere?->code}_S{$semester}.pdf";

        return $pdf->download($fileName);
    }

    /**
     * Exporter le PV en PDF via query params uniquement (sans ID de délibération).
     * Utilisé par le bouton frontend : /deliberations/export-pv-pdf?type=annuel&filiere_id=1
     */
    public function exportPvQuery(Request $request)
    {
        try {
            $type = $request->query('type', 'annuel');
            $filiereId = (int) $request->query('filiere_id', 1);
            $academicYearId = (int) $request->query('academic_year_id', 0);
            $yearLevel = (int) $request->query('year_level', 1);
            $semesterNum = (int) $request->query('semester_number', 1);

            $filiere = Filiere::find($filiereId) ?? (object) ['name' => 'Tronc Commun ENCG', 'code' => 'ENCG'];
            $academicYear = $academicYearId
                ? AcademicYear::find($academicYearId)
                : (AcademicYear::where('is_current', true)->first()
                    ?? AcademicYear::orderByDesc('id')->first()
                    ?? (object) ['name' => date('Y').'/'.(date('Y') + 1), 'id' => 1]);

            $academicYearId = $academicYear->id ?? 1;

            $logoPath = public_path('logo-encg.png');
            $logoBase64 = file_exists($logoPath)
                ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath))
                : '';

            $verifyUrl = url('/documents/verify/'.Str::random(12));
            try {
                $qrSvg = QrCode::size(150)->margin(0)->generate($verifyUrl);
                $qrBase64 = 'data:image/svg+xml;base64,'.base64_encode($qrSvg);
            } catch (\Exception $e) {
                $qrBase64 = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='.urlencode($verifyUrl);
            }

            if ($type === 'annuel') {
                $annualData = $this->deliberationService->calculateAnnualCompensation($filiereId, $academicYearId, $yearLevel);
                $juries = $this->deliberationService->autoComposeJury($filiereId, $academicYearId, null, 'annuel');

                $viewData = [
                    'filiere' => $filiere,
                    'yearLevel' => $yearLevel,
                    'academicYear' => $academicYear,
                    'odd_semester_label' => $annualData['odd_semester_label'] ?? 'S'.(($yearLevel * 2) - 1),
                    'even_semester_label' => $annualData['even_semester_label'] ?? 'S'.($yearLevel * 2),
                    'modules' => $annualData['modules'] ?? [],
                    'students' => $annualData['students'] ?? [],
                    'juries' => $juries,
                    'logoBase64' => $logoBase64,
                    'qrBase64' => $qrBase64,
                    'verifyUrl' => $verifyUrl,
                    'date' => date('d/m/Y H:i'),
                ];

                $pdfView = 'pdf.pv_annuel';
                $paper = 'a3';
            } else {
                $pvResult = $this->deliberationService->getSemesterPVWithReservistes($filiereId, $academicYearId, $semesterNum);
                $juries = $this->deliberationService->autoComposeJury($filiereId, $academicYearId, $semesterNum, 'semestriel');

                $viewData = [
                    'filiere' => $filiere,
                    'academicYear' => $academicYear,
                    'semesterNum' => $semesterNum,
                    'type' => $type,
                    'modules' => $pvResult['modules'] ?? [],
                    'matrix' => $pvResult['matrix'] ?? [],
                    'juries' => $juries,
                    'logoBase64' => $logoBase64,
                    'qrBase64' => $qrBase64,
                    'verifyUrl' => $verifyUrl,
                    'date' => date('d/m/Y H:i'),
                ];

                $pdfView = 'pdf.pv_semestriel';
                $paper = 'a4';
            }

            if (! view()->exists($pdfView)) {
                return response()->json(['message' => "Vue PDF '{$pdfView}' introuvable."], 404);
            }

            $pdf = Pdf::loadView($pdfView, $viewData)->setPaper($paper, 'landscape');

            $filiereSlug = Str::slug($filiere->name ?? 'Filiere', '_');
            $yearName = Str::slug($academicYear->name ?? date('Y'), '_');

            if ($type === 'annuel') {
                $fileName = "PV_Annuel_{$filiereSlug}_Annee{$yearLevel}_{$yearName}.pdf";
            } else {
                $fileName = "PV_Semestriel_{$filiereSlug}_S{$semesterNum}_{$yearName}.pdf";
            }

            return $pdf->download($fileName);
        } catch (\Throwable $e) {
            Log::error('exportPvQuery error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json(['message' => 'Erreur génération PDF : '.$e->getMessage()], 500);
        }
    }

    /**
     * Exporter le PV en PDF (semestriel ou annuel) via l'ID de la délibération.
     */
    public function exportPvPdf(int $id, Request $request)
    {
        $delib = Deliberation::with(['semester', 'filiere', 'academicYear'])->find($id);
        $type = $request->query('type', 'semestriel');
        $filiereId = $request->query('filiere_id', $delib?->filiere_id ?? 1);
        $academicYearId = $request->query('academic_year_id', $delib?->academic_year_id ?? 1);
        $semesterNum = $request->query('semester_number', $delib?->semester?->semester_number ?? 1);

        $juries = $this->deliberationService->autoComposeJury($filiereId, $academicYearId, $type === 'semestriel' ? $semesterNum : null, $type);

        $filiere = Filiere::find($filiereId);
        $academicYear = AcademicYear::find($academicYearId);

        if ($type === 'annuel') {
            $matrix = $this->deliberationService->calculateAnnualCompensation($filiereId, $academicYearId);
            $modules = Module::where('filiere_id', $filiereId)->get();
            $pdfView = 'pdf.pv_annuel';
        } else {
            $pvResult = $this->deliberationService->getSemesterPVWithReservistes($filiereId, $academicYearId, $semesterNum);
            $modules = $pvResult['modules'];
            $matrix = $pvResult['matrix'];
            $pdfView = 'pdf.pv_semestriel';
        }

        $viewData = compact('filiere', 'academicYear', 'semesterNum', 'type', 'modules', 'matrix', 'juries');
        $viewData['seal_hash'] = $delib?->seal_hash;
        $viewData['voters'] = $delib
            ? DB::table('deliberation_votes')->where('deliberation_id', $delib->id)->get()
            : collect();

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
        $filiereId = (int) $request->query('filiere_id', 1);
        $academicYearId = (int) $request->query('academic_year_id', 1);
        $semesterNum = (int) $request->query('semester_number', 1);
        $type = $request->query('type', 'semestriel');

        $juries = $this->deliberationService->autoComposeJury($filiereId, $academicYearId, $type === 'semestriel' ? $semesterNum : null, $type);

        $totalMembers = count($juries);
        $signedCount = collect($juries)->where('status', 'signed')->count();

        return response()->json([
            'success' => true,
            'type' => $type,
            'total_members' => $totalMembers,
            'signed_count' => $signedCount,
            'members' => $juries,
        ]);
    }

    /**
     * Signer le PV par un membre du jury.
     */
    public function signJury(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'jury_id' => 'required|integer',
            'signature_data' => 'required|string',
        ]);

        $user = $request->user();
        if (! $user) {
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
            'message' => 'Signature enregistrée avec succès.',
            'digital_seal' => $result['digital_seal'],
            'signed_at' => $result['signed_at'],
        ]);
    }

    /**
     * Compensation annuelle (S1+S2).
     */
    public function getAnnualCompensation(Request $request): JsonResponse
    {
        $filiereId = (int) $request->query('filiere_id', 1);
        $academicYearId = (int) $request->query('academic_year_id', 1);
        $yearLevel = (int) $request->query('year_level', 1);

        $results = $this->deliberationService->calculateAnnualCompensation($filiereId, $academicYearId, $yearLevel);

        return response()->json(['data' => $results]);
    }

    public function vote(Request $request, int $id): JsonResponse
    {
        $delib = Deliberation::findOrFail($id);
        $validated = $request->validate([
            'decision' => 'required|string|max:50',
            'comment' => 'nullable|string|max:2000',
        ]);
        app(DeliberationSealService::class)->vote(
            $delib,
            $request->user(),
            $validated['decision'],
            $validated['comment'] ?? null
        );

        return response()->json(['success' => true]);
    }

    public function seal(Request $request, int $id): JsonResponse
    {
        $hash = app(DeliberationSealService::class)->seal(
            Deliberation::findOrFail($id),
            $request->user()
        );

        return response()->json(['success' => true, 'seal_hash' => $hash]);
    }

    public function requestReopen(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(['motif' => 'required|string|min:8']);
        $requestId = app(DeliberationSealService::class)->requestReopen(
            Deliberation::findOrFail($id),
            $request->user(),
            $validated['motif']
        );

        return response()->json(['success' => true, 'reopen_request_id' => $requestId]);
    }

    public function approveReopen(Request $request, int $requestId): JsonResponse
    {
        app(DeliberationSealService::class)->approveReopen($requestId, $request->user());

        return response()->json(['success' => true]);
    }
}
