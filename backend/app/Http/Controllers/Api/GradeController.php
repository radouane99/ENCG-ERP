<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\GradeService;
use Illuminate\Support\Facades\Log;

class GradeController extends Controller
{
    protected GradeService $gradeService;

    public function __construct(GradeService $gradeService)
    {
        $this->gradeService = $gradeService;
    }

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

        try {
            $result = $this->gradeService->storeBatch(
                $validated['module_id'],
                $validated['academic_year_id'],
                $validated['grades'],
                $request->user()->id ?? null
            );

            return response()->json([
                'success' => true,
                'message' => "{$result['count']} notes ont été enregistrées avec succès.",
            ]);

        } catch (\Exception $e) {
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

        $updatedCount = $this->gradeService->validateGrades(
            $validated['module_id'], 
            $validated['academic_year_id']
        );

        return response()->json([
            'success' => true,
            'message' => "$updatedCount notes ont été validées définitivement."
        ]);
    }
}
