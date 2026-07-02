<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\GradeLockService;
use App\Services\Academic\ApogeeDeliberationEngine;

class ApogeeEngineController extends Controller
{
    protected GradeLockService $gradeLockService;
    protected ApogeeDeliberationEngine $deliberationEngine;

    public function __construct(GradeLockService $gradeLockService, ApogeeDeliberationEngine $deliberationEngine)
    {
        $this->gradeLockService = $gradeLockService;
        $this->deliberationEngine = $deliberationEngine;
    }

    /**
     * Admin opens a grade entry period for professors.
     */
    public function openGradePeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|integer',
            'semester_id' => 'required|integer',
            'exam_session_id' => 'required|integer',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $period = $this->gradeLockService->openPeriod(
            $validated['academic_year_id'],
            $validated['semester_id'],
            $validated['exam_session_id'],
            $validated['start_date'],
            $validated['end_date'],
            $request->user()->id ?? 1
        );

        if (class_exists('Spatie\Activitylog\Models\Activity')) {
            activity()
                ->performedOn($period)
                ->event('opened')
                ->log('Admin opened grade entry period');
        }

        return response()->json([
            'success' => true,
            'message' => 'Période de saisie des notes ouverte avec succès.',
            'data' => $period
        ]);
    }

    /**
     * Run a mock APOGEE deliberation for a student to verify the engine.
     */
    public function mockDeliberation(Request $request): JsonResponse
    {
        $cc = $request->input('cc_grade', 8);
        $resit = $request->input('resit_grade', 18);
        
        $ordinaryResult = $this->deliberationEngine->calculateModuleGrade($cc, 7, false);
        $resitResult = $this->deliberationEngine->calculateResitGrade($cc, $resit, false);

        $semesterGrades = [
            ['module_id' => 1, 'grade' => 8],
            ['module_id' => 2, 'grade' => 12]
        ];
        
        $compensation = $this->deliberationEngine->applyCompensation($semesterGrades);
        $progression = $this->deliberationEngine->evaluateProgression(3);

        return response()->json([
            'success' => true,
            'data' => [
                'rule_1_module_ordinary' => $ordinaryResult,
                'rule_2_module_resit' => [
                    'cc' => $cc,
                    'resit_exam' => $resit,
                    'result' => $resitResult,
                ],
                'rule_3_semester_compensation' => $compensation,
                'rule_4_progression' => [
                    'failed_modules' => 3,
                    'decision' => $progression
                ]
            ]
        ]);
    }
}
