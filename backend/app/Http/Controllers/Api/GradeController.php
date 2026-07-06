<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\GradeService;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\Academic\StoreGradeBatchRequest;
use App\Http\Requests\Academic\ValidateGradesRequest;

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
    public function storeBatch(StoreGradeBatchRequest $request): JsonResponse
    {
        $validated = $request->validated();

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
    public function validateGrades(ValidateGradesRequest $request): JsonResponse
    {
        $validated = $request->validated();

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
