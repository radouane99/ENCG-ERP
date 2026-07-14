<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Grade;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GradeController extends Controller
{
    /**
     * Fetch students and their current grades for a specific assessment.
     */
    public function getForAssessment($assessmentId, Request $request): JsonResponse
    {
        $assessment = Assessment::with('module')->findOrFail($assessmentId);
        
        // We find all students registered to the module's filiere for the current active academic year
        // We'll assume academic_year_id = 1 for this implementation, or extract from request if provided
        $academicYearId = $request->query('academic_year_id', 1);

        $studentsQuery = Student::whereHas('registrations', function ($q) use ($assessment, $academicYearId) {
            $q->where('filiere_id', $assessment->module->filiere_id)
              ->where('academic_year_id', $academicYearId);
        });

        // Eager load grades for this specific assessment
        $students = $studentsQuery->with(['grades' => function ($q) use ($assessmentId) {
            $q->where('assessment_id', $assessmentId);
        }])->get();

        $data = $students->map(function ($student) {
            $grade = $student->grades->first();
            return [
                'student_id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'student_number' => $student->student_number,
                'apogee' => $student->cne_cme ?? $student->student_number, // Fallback
                'value' => $grade ? (float) $grade->value : null,
                'is_absent' => $grade ? (bool) $grade->absent : false,
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Bulk save grades for an assessment.
     */
    public function storeBulk(Request $request, $assessmentId): JsonResponse
    {
        $assessment = Assessment::findOrFail($assessmentId);

        $validated = $request->validate([
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.value' => 'nullable|numeric|min:0|max:20',
            'grades.*.absent' => 'boolean',
        ]);

        foreach ($validated['grades'] as $gradeData) {
            Grade::updateOrCreate(
                [
                    'student_id' => $gradeData['student_id'],
                    'assessment_id' => $assessment->id,
                ],
                [
                    'value' => !empty($gradeData['absent']) ? null : ($gradeData['value'] ?? null),
                    'absent' => $gradeData['absent'] ?? false,
                ]
            );
        }

        return response()->json(['message' => 'Notes enregistrées avec succès.']);
    }
}
