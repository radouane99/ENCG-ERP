<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Grade;
use App\Http\Requests\StoreGradeRequest;
use Illuminate\Http\JsonResponse;

class GradeController extends Controller
{
    public function storeBulk(StoreGradeRequest $request, Assessment $assessment): JsonResponse
    {
        // Enforce Professor Authorization
        // $request->user()->can('grade', $assessment->module);
        
        $gradesData = $request->validated('grades');

        foreach ($gradesData as $gradeData) {
            Grade::updateOrCreate(
                [
                    'student_id' => $gradeData['student_id'],
                    'assessment_id' => $assessment->id,
                ],
                [
                    'value' => $gradeData['absent'] ? null : $gradeData['value'],
                    'absent' => $gradeData['absent'] ?? false,
                ]
            );
        }

        return response()->json(['message' => 'Grades saved successfully.']);
    }

    public function getForAssessment(Assessment $assessment): JsonResponse
    {
        $grades = Grade::where('assessment_id', $assessment->id)->get();
        return response()->json([
            'data' => \App\Http\Resources\GradeResource::collection($grades)
        ]);
    }
}
