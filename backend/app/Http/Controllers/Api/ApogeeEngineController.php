<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\Student;
use App\Models\Grade;
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
     * Run real APOGEE deliberation for a student
     */
    public function runDeliberation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'semester_id' => 'required|integer' // 1 or 2
        ]);

        $studentId = $validated['student_id'];
        
        // Fetch all grades for this student
        $grades = Grade::with('gradeComponent.module')
            ->where('student_id', $studentId)
            ->get();

        $processedModules = [];
        $semesterGradesForCompensation = [];
        $failedModulesCount = 0;

        foreach ($grades as $grade) {
            $val = $grade->value;
            // Simplified APOGEE check: is it >= 10
            $isValidated = $val >= 10;
            
            $processedModules[] = [
                'module_id' => $grade->gradeComponent->module_id ?? 0,
                'module_name' => $grade->gradeComponent->module->name ?? 'Unknown',
                'grade' => $val,
                'validated' => $isValidated
            ];

            $semesterGradesForCompensation[] = [
                'module_id' => $grade->gradeComponent->module_id ?? 0,
                'grade' => $val
            ];

            if (!$isValidated) {
                $failedModulesCount++;
            }
        }
        
        $compensation = $this->deliberationEngine->applyCompensation($semesterGradesForCompensation);
        $progression = $this->deliberationEngine->evaluateProgression($failedModulesCount);

        // Store result in DB (assuming Deliberation table exists)
        $delibId = DB::table('deliberations')->insertGetId([
            'academic_year_id' => 1,
            'semester_id' => $validated['semester_id'],
            'status' => 'validated',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('deliberation_decisions')->insert([
            'deliberation_id' => $delibId,
            'student_id' => $studentId,
            'decision_type' => $compensation['is_validated'] ? 'pass' : 'fail',
            'gpa' => $compensation['average'],
            'comments' => 'Automated APOGEE deliberation',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Délibération APOGEE exécutée avec succès.',
            'data' => [
                'student_id' => $studentId,
                'modules_results' => $processedModules,
                'semester_compensation' => $compensation,
                'progression_decision' => [
                    'failed_modules_count' => $failedModulesCount,
                    'decision' => $progression
                ]
            ]
        ]);
    }
}
