<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Group;
use App\Models\Module;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeGridController extends Controller
{
    /**
     * Get students and their grades for a specific module and group.
     */
    public function getGrid(Request $request): JsonResponse
    {
        $moduleId = $request->query('module_id');
        $groupId = $request->query('group_id');

        if (! $moduleId || ! $groupId) {
            return response()->json(['success' => false, 'message' => 'module_id et group_id sont requis.'], 400);
        }

        $students = Student::whereHas('registrations', function ($query) use ($groupId) {
            $query->where('group_id', $groupId);
        })->with(['user'])->get();

        // Find or create CC and Exam assessments for this module
        $ccAssessment = Assessment::firstOrCreate(
            ['module_id' => $moduleId, 'type' => 'CC'],
            ['weight' => 50.00, 'date' => now()->format('Y-m-d')]
        );

        $examAssessment = Assessment::firstOrCreate(
            ['module_id' => $moduleId, 'type' => 'Exam'],
            ['weight' => 50.00, 'date' => now()->format('Y-m-d')]
        );

        $studentIds = $students->pluck('id');

        $ccGrades = \DB::table('grades')
            ->whereIn('student_id', $studentIds)
            ->where('assessment_id', $ccAssessment->id)
            ->get()
            ->keyBy('student_id');

        $examGrades = \DB::table('grades')
            ->whereIn('student_id', $studentIds)
            ->where('assessment_id', $examAssessment->id)
            ->get()
            ->keyBy('student_id');

        $gridData = $students->map(function ($student) use ($ccGrades, $examGrades) {
            $ccGrade = $ccGrades->get($student->id);
            $examGrade = $examGrades->get($student->id);

            $ccNum = ($ccGrade && ! $ccGrade->absent && $ccGrade->value !== null) ? floatval($ccGrade->value) : null;
            $examNum = ($examGrade && ! $examGrade->absent && $examGrade->value !== null) ? floatval($examGrade->value) : null;

            $ccAbsent = $ccGrade ? (bool) $ccGrade->absent : false;
            $examAbsent = $examGrade ? (bool) $examGrade->absent : false;

            $average = null;
            $status = 'Non saisie';

            if ($ccNum !== null && $examNum !== null) {
                $average = ($ccNum * 0.5) + ($examNum * 0.5);
                $status = 'Validée';
            } elseif ($ccNum !== null || $examNum !== null || $ccAbsent || $examAbsent) {
                $status = 'Saisie en cours';
            }

            return [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'cc' => $ccNum,
                'exam' => $examNum,
                'cc_absent' => $ccAbsent,
                'exam_absent' => $examAbsent,
                'average' => $average,
                'status' => $status,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $gridData,
            'meta' => [
                'module_name' => Module::find($moduleId)?->name ?? 'Module inconnu',
                'group_name' => Group::find($groupId)?->name ?? 'Groupe inconnu',
                'weights' => ['cc' => 0.5, 'exam' => 0.5],
            ],
        ]);
    }

    /**
     * Save a single grade or batch from the grid (AJAX).
     */
    public function saveGrades(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|integer',
            'group_id' => 'required|integer',
            'updates' => 'required|array',
            'updates.*.student_id' => 'required|integer',
            'updates.*.cc' => 'nullable|numeric|min:0|max:20',
            'updates.*.exam' => 'nullable|numeric|min:0|max:20',
            'updates.*.cc_absent' => 'nullable|boolean',
            'updates.*.exam_absent' => 'nullable|boolean',
        ]);

        $moduleId = $validated['module_id'];

        // Find or create CC and Exam assessments for this module
        $ccAssessment = Assessment::firstOrCreate(
            ['module_id' => $moduleId, 'type' => 'CC'],
            ['weight' => 50.00, 'date' => now()->format('Y-m-d')]
        );

        $examAssessment = Assessment::firstOrCreate(
            ['module_id' => $moduleId, 'type' => 'Exam'],
            ['weight' => 50.00, 'date' => now()->format('Y-m-d')]
        );

        $weightCc = 0.5;
        $weightExam = 0.5;

        $results = [];

        foreach ($validated['updates'] as $update) {
            $studentId = $update['student_id'];

            // Save CC Note
            if (array_key_exists('cc', $update) || isset($update['cc_absent'])) {
                $ccVal = $update['cc'] ?? null;
                $ccAbsent = $update['cc_absent'] ?? false;

                \DB::table('grades')->updateOrInsert(
                    ['student_id' => $studentId, 'assessment_id' => $ccAssessment->id],
                    [
                        'value' => $ccAbsent ? null : $ccVal,
                        'absent' => $ccAbsent,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }

            // Save Exam Note
            if (array_key_exists('exam', $update) || isset($update['exam_absent'])) {
                $examVal = $update['exam'] ?? null;
                $examAbsent = $update['exam_absent'] ?? false;

                \DB::table('grades')->updateOrInsert(
                    ['student_id' => $studentId, 'assessment_id' => $examAssessment->id],
                    [
                        'value' => $examAbsent ? null : $examVal,
                        'absent' => $examAbsent,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }

            // Re-fetch CC & Exam Notes to calculate correct averages
            $ccGrade = \DB::table('grades')
                ->where('student_id', $studentId)
                ->where('assessment_id', $ccAssessment->id)
                ->first();

            $examGrade = \DB::table('grades')
                ->where('student_id', $studentId)
                ->where('assessment_id', $examAssessment->id)
                ->first();

            $ccNum = ($ccGrade && ! $ccGrade->absent && $ccGrade->value !== null) ? floatval($ccGrade->value) : null;
            $examNum = ($examGrade && ! $examGrade->absent && $examGrade->value !== null) ? floatval($examGrade->value) : null;

            $average = null;
            $status = 'Non saisie';

            if ($ccNum !== null && $examNum !== null) {
                $average = ($ccNum * $weightCc) + ($examNum * $weightExam);
                $status = 'Validée';
            } elseif ($ccNum !== null || $examNum !== null || ($ccGrade && $ccGrade->absent) || ($examGrade && $examGrade->absent)) {
                $status = 'Saisie en cours';
            }

            $results[] = [
                'student_id' => $studentId,
                'average' => $average,
                'status' => $status,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => count($validated['updates']).' note(s) enregistrée(s) avec succès.',
            'calculated_results' => $results,
        ]);
    }
}
