<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeComponent;
use App\Models\Grade;
use App\Models\ExamSession;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GradeController extends Controller
{
    /**
     * Fetch students and their current grades for a specific component and session.
     */
    public function getStudentsForGrading(GradeComponent $component, Request $request): JsonResponse
    {
        $examSessionId = $request->query('exam_session_id');
        $examSession = ExamSession::findOrFail($examSessionId);

        // Fetch students belonging to this module's group/filiere
        // For simplicity in this endpoint, we'll fetch all students registered to the module's semester/filiere
        $studentsQuery = Student::whereHas('registrations', function ($q) use ($component, $examSession) {
            $q->where('filiere_id', $component->module->filiere_id)
              ->where('academic_year_id', $examSession->academic_year_id);
        });

        // Filter Rattrapage: only fetch students who are eligible for Rattrapage
        if ($examSession->type === 'RATTRAPAGE') {
            $studentsQuery->whereHas('resitEligibilities', function ($q) use ($component) {
                $q->where('module_id', $component->module_id)
                  ->where('is_eligible', true);
            });
        }

        $students = $studentsQuery->with(['grades' => function ($q) use ($component, $examSession) {
            $q->where('grade_component_id', $component->id)
              ->where('exam_session_id', $examSession->id);
        }])->get();

        $data = $students->map(function ($student) {
            $grade = $student->grades->first();
            return [
                'student_id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'student_number' => $student->student_number,
                'score' => $grade ? $grade->score : null,
                'is_absent' => $grade ? $grade->is_absent : false,
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Bulk save grades.
     */
    public function storeBulk(Request $request, GradeComponent $component): JsonResponse
    {
        $validated = $request->validate([
            'exam_session_id' => 'required|exists:exam_sessions,id',
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.score' => 'nullable|numeric|min:0|max:20',
            'grades.*.is_absent' => 'boolean',
        ]);

        foreach ($validated['grades'] as $gradeData) {
            Grade::updateOrCreate(
                [
                    'student_id' => $gradeData['student_id'],
                    'grade_component_id' => $component->id,
                    'exam_session_id' => $validated['exam_session_id'],
                ],
                [
                    'score' => $gradeData['is_absent'] ? null : ($gradeData['score'] ?? null),
                    'is_absent' => $gradeData['is_absent'] ?? false,
                    'entered_by' => auth()->id() ?? 1, // Fallback to 1 if not authed for dev
                    'entered_at' => now(),
                ]
            );
        }

        return response()->json(['message' => 'Grades saved successfully.']);
    }
}
