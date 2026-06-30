<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Grade;
use App\Models\Student;
use App\Models\Module;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GradeController extends Controller
{
    /**
     * Store or update a batch of grades submitted by a professor.
     */
    public function storeBatch(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('grades.enter') || $request->user()->can('grades.edit'), 403);

        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.value' => 'required|numeric|min:0|max:20',
            'grades.*.type' => 'required|in:normal,rattrapage',
        ]);

        DB::beginTransaction();
        try {
            $savedCount = 0;
            foreach ($validated['grades'] as $gradeData) {
                Grade::updateOrCreate(
                    [
                        'student_id' => $gradeData['student_id'],
                        'module_id' => $validated['module_id'],
                        'academic_year_id' => $validated['academic_year_id'],
                        'type' => $gradeData['type'],
                    ],
                    [
                        'value' => $gradeData['value'],
                        'status' => 'draft', // Requires admin validation later
                        'created_by' => $request->user()->id ?? null
                    ]
                );
                $savedCount++;
            }
            
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "$savedCount notes ont été enregistrées avec succès.",
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Grade Batch Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la sauvegarde des notes.'
            ], 500);
        }
    }
    
    /**
     * Validate draft grades (Admin only)
     */
    public function validateGrades(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('grades.validate'), 403);

        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        $updated = Grade::where('module_id', $validated['module_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('status', 'draft')
            ->update(['status' => 'validated']);

        return response()->json([
            'success' => true,
            'message' => "$updated notes ont été validées."
        ]);
    }
}
