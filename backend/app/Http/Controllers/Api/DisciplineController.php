<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\StudentAffairsService;

class DisciplineController extends Controller
{
    protected StudentAffairsService $affairsService;

    public function __construct(StudentAffairsService $affairsService)
    {
        $this->affairsService = $affairsService;
    }

    /**
     * Display a listing of the discipline cases.
     */
    public function index(): JsonResponse
    {
        $cases = $this->affairsService->getAllDisciplineCases();
        
        return response()->json([
            'success' => true,
            'data' => $cases
        ]);
    }

    /**
     * Report a new incident.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id'    => 'required|integer|exists:students,id',
            'incident_date' => 'required|date',
            'type'          => 'required|string',
            'description'   => 'required|string',
            'severity'      => 'nullable|string|in:low,medium,high'
        ]);

        $reporterId = auth()->id();
        if (!$reporterId) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non authentifié.'], 403);
        }

        $case = $this->affairsService->reportIncident($validated, $reporterId);

        return response()->json([
            'success' => true,
            'message' => 'Incident signalé avec succès.',
            'data' => $case
        ], 201);
    }

    /**
     * Make a decision on a specific discipline case.
     */
    public function decide(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'decision' => 'required|string|in:warning,blame,annulation_module,annulation_semestre,exclusion,dismissed',
            'notes'    => 'nullable|string'
        ]);

        try {
            $case = $this->affairsService->makeDecision((int) $id, $validated['decision'], $validated['notes'] ?? null);
            
            return response()->json([
                'success' => true,
                'message' => 'Décision disciplinaire enregistrée.',
                'data' => $case
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
