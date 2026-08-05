<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\AttendanceSession;
use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\Grade;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Services\Academic\ApogeeDeliberationEngine;
use App\Services\Academic\GradeLockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApogeeEngineController extends Controller
{
    public function __construct(
        private GradeLockService $gradeLockService,
        private ApogeeDeliberationEngine $deliberationEngine
    ) {}

    /**
     * Ouvrir une période de saisie des notes.
     */
    public function openGradePeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|integer',
            'semester_id'      => 'required|integer',
            'exam_session_id'  => 'required|integer',
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after_or_equal:start_date',
        ]);

        $period = $this->gradeLockService->openPeriod(
            $validated['academic_year_id'],
            $validated['semester_id'],
            $validated['exam_session_id'],
            $validated['start_date'],
            $validated['end_date'],
            $request->user()?->id ?? 1
        );

        if (class_exists('Spatie\Activitylog\Models\Activity')) {
            activity()->performedOn($period)->event('opened')->log('Période de saisie ouverte');
        }

        return response()->json([
            'success' => true,
            'message' => 'Période de saisie des notes ouverte.',
            'data'    => $period,
        ]);
    }

    /**
     * Lancer la délibération APOGEE pour un étudiant.
     */
    public function runDeliberation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id'  => 'required|integer|exists:students,id',
            'semester_id' => 'required|integer',
        ]);

        $studentId = $validated['student_id'];
        $grades    = Grade::with('assessment.module')->where('student_id', $studentId)->get();

        $processedModules = [];
        $semesterGrades   = [];
        $failedModules    = 0;

        foreach ($grades as $grade) {
            $isValidated = $grade->value >= 10;

            $processedModules[] = [
                'module_id'   => $grade->assessment->module_id ?? 0,
                'module_name' => $grade->assessment->module->name ?? 'Inconnu',
                'grade'       => $grade->value,
                'validated'   => $isValidated,
            ];

            $semesterGrades[] = [
                'module_id' => $grade->assessment->module_id ?? 0,
                'grade'     => $grade->value,
            ];

            if (!$isValidated) $failedModules++;
        }

        $compensation = $this->deliberationEngine->applyCompensation($semesterGrades);
        $progression  = $this->deliberationEngine->evaluateProgression($failedModules);

        $delib = Deliberation::create([
            'academic_year_id' => 1,
            'semester_id'      => $validated['semester_id'],
            'status'           => 'validated',
        ]);

        DeliberationDecision::create([
            'deliberation_id' => $delib->id,
            'student_id'      => $studentId,
            'decision_type'   => $compensation['is_validated'] ? 'pass' : 'fail',
            'gpa'             => $compensation['average'],
            'comments'        => 'Délibération APOGEE automatisée',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Délibération APOGEE exécutée.',
            'data'    => [
                'student_id'            => $studentId,
                'modules_results'       => $processedModules,
                'semester_compensation' => $compensation,
                'progression_decision'  => ['failed_modules_count' => $failedModules, 'decision' => $progression],
            ],
        ]);
    }

    /**
     * Valider un candidat et générer Code APOGEE + CNE.
     */
    public function validateCandidate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id'     => 'required|integer',
            'filiere_id'     => 'required|integer',
            'group_id'       => 'nullable|integer',
            'admission_type' => 'nullable|string',
        ]);

        $student = Student::findOrFail($validated['student_id']);
        $apogeeCode = '26' . str_pad((string) $student->id, 6, '0', STR_PAD_LEFT);
        $cneCode    = 'K' . str_pad((string) random_int(10000000, 99999999), 8, '0', STR_PAD_LEFT);

        $student->update([
            'student_number' => $apogeeCode,
            'cne'            => $cneCode,
            'status'         => 'active',
        ]);

        $academicYearId = AcademicYear::where('is_current', true)->value('id') ?? 1;

        StudentPathway::updateOrCreate(
            ['student_id' => $student->id, 'is_current' => true],
            [
                'filiere_id'       => $validated['filiere_id'],
                'group_id'         => $validated['group_id'] ?? null,
                'academic_year_id' => $academicYearId,
                'current_semester' => 1,
            ]
        );

        StudentRegistration::firstOrCreate(
            ['student_id' => $student->id, 'filiere_id' => $validated['filiere_id']],
            ['academic_year_id' => 1]
        );

        return response()->json([
            'success' => true,
            'message' => 'Candidat validé. Code APOGEE et CNE attribués.',
            'data'    => [
                'student_id'     => $student->id,
                'student_name'   => $student->user->name ?? 'N/A',
                'apogee_code'    => $apogeeCode,
                'cne'            => $cneCode,
                'filiere_id'     => $validated['filiere_id'],
                'group_id'       => $validated['group_id'] ?? null,
                'admission_type' => $validated['admission_type'] ?? 'TAFEM',
            ],
        ]);
    }

    /**
     * Calculer la paie des vacataires.
     */
    public function calculateVacationPayroll(): JsonResponse
    {
        $vacataires = User::where('role', 'vacataire')->select('id', 'name', 'email')->get();

        $payroll        = [];
        $totalHoursAll  = 0;
        $totalBudgetMad = 0;

        foreach ($vacataires as $v) {
            $sessionsCount = AttendanceSession::where('professor_id', $v->id)->count();
            $hoursDone     = $sessionsCount * 2;
            $rate          = 350;
            $amount        = $hoursDone * $rate;

            $totalHoursAll  += $hoursDone;
            $totalBudgetMad += $amount;

            $payroll[] = [
                'vacataire_id'      => $v->id,
                'name'              => $v->name,
                'email'             => $v->email,
                'sessions_count'    => $sessionsCount,
                'hours_performed'   => $hoursDone,
                'hourly_rate_mad'   => $rate,
                'total_amount_mad'  => number_format($amount, 2),
                'payment_status'    => 'Prêt pour Ordonnancement DAF',
            ];
        }

        return response()->json([
            'success' => true,
            'summary' => [
                'total_vacataires'    => count($payroll),
                'total_hours_emarges' => $totalHoursAll,
                'total_payroll_mad'   => number_format($totalBudgetMad, 2),
                'calculated_at'       => now()->toIso8601String(),
            ],
            'payroll_details' => $payroll,
        ]);
    }
}