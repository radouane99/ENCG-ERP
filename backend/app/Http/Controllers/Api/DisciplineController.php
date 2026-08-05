<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Academic\StudentAffairsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisciplineController extends Controller
{
    public function __construct(
        private StudentAffairsService $affairsService
    ) {}

    /**
     * Liste des cas disciplinaires.
     */
    public function index(): JsonResponse
    {
        $cases = $this->affairsService->getAllDisciplineCases();

        return response()->json([
            'success' => true,
            'data'    => $cases,
        ]);
    }

    /**
     * Signaler un incident.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id'    => 'required|integer|exists:students,id',
            'incident_date' => 'required|date',
            'type'          => 'required|string',
            'description'   => 'required|string',
            'severity'      => 'nullable|string|in:low,medium,high',
        ]);

        $reporterId = auth()->id();
        if (!$reporterId) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non authentifié.'], 403);
        }

        $case = $this->affairsService->reportIncident($validated, $reporterId);

        return response()->json([
            'success' => true,
            'message' => 'Incident signalé avec succès.',
            'data'    => $case,
        ], 201);
    }

    /**
     * Prendre une décision disciplinaire.
     */
    public function decide(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'decision' => 'required|string|in:warning,blame,annulation_module,annulation_semestre,exclusion,dismissed',
            'notes'    => 'nullable|string',
        ]);

        try {
            $case = $this->affairsService->makeDecision($id, $validated['decision'], $validated['notes'] ?? null);

            return response()->json([
                'success' => true,
                'message' => 'Décision disciplinaire enregistrée.',
                'data'    => $case,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}