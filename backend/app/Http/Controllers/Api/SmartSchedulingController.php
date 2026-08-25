<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Academic\SlotSuggestionService;
use App\Services\Academic\SmartSchedulingEngine;
use App\Services\Academic\TimetableCampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmartSchedulingController extends Controller
{
    public function __construct(
        private SmartSchedulingEngine $engine,
        private SlotSuggestionService $slotSuggestions,
        private TimetableCampaignService $campaigns
    ) {}

    /**
     * Simulation CSP en mémoire (Dry Run) avec rapport statistique et détection de conflits.
     */
    public function simulate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filiere_id' => 'nullable|integer|exists:filieres,id',
            'semester_id' => 'nullable|integer|exists:semesters,id',
            'energy_weight' => 'nullable|numeric|min:0|max:100',
            'prof_avail_weight' => 'nullable|numeric|min:0|max:100',
            'include_saturday' => 'nullable|boolean',
            'max_daily_hours' => 'nullable|integer|min:4|max:10',
        ]);

        $result = $this->engine->simulate($validated);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Réorganisation performante des séances existantes (0 conflit prof / salle / groupe).
     */
    public function reoptimize(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filiere_id' => 'nullable|integer|exists:filieres,id',
            'energy_weight' => 'nullable|numeric|min:0|max:100',
            'max_daily_hours' => 'nullable|integer|min:4|max:10',
            'persist' => 'nullable|boolean',
        ]);

        $result = $this->engine->reoptimizeExisting($validated);

        return response()->json([
            'success' => $result['success'] ?? false,
            'data' => $result,
        ], ($result['success'] ?? false) ? 200 : 422);
    }

    /**
     * Génération CSP & Publication officielle dans la base de données.
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filiere_id' => 'nullable|integer|exists:filieres,id',
            'semester_id' => 'nullable|integer|exists:semesters,id',
            'academic_year_id' => 'nullable|integer',
            'energy_weight' => 'nullable|numeric|min:0|max:100',
            'prof_avail_weight' => 'nullable|numeric|min:0|max:100',
            'overwrite' => 'nullable|boolean',
            'include_saturday' => 'nullable|boolean',
        ]);

        $result = $this->engine->generateAndPublish($validated);

        return response()->json([
            'success' => $result['success'] ?? false,
            'data' => $result,
        ], ($result['success'] ?? false) ? 200 : 422);
    }

    /**
     * Statistiques globales de performance et d'occupation des salles.
     */
    public function stats(): JsonResponse
    {
        $stats = $this->engine->getGlobalStats();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    public function suggestSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => 'nullable|integer',
            'group_id' => 'nullable|integer',
            'professor_id' => 'nullable|integer',
            'date' => 'nullable|date',
        ]);

        $slots = $this->slotSuggestions->suggest($validated);

        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }

    public function workspace(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->campaigns->workspace(),
        ]);
    }

    public function openCampaign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'allow_saturday' => 'nullable|boolean',
        ]);
        $campaign = $this->campaigns->openCampaign(
            (int) $request->user()->id,
            (bool) ($validated['allow_saturday'] ?? false)
        );

        return response()->json(['success' => true, 'data' => $campaign]);
    }

    public function closeCampaign(): JsonResponse
    {
        $campaign = $this->campaigns->closeCampaign();

        return response()->json(['success' => true, 'data' => $campaign]);
    }

    public function generateDraft(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filiere_id' => 'required|integer|exists:filieres,id',
            'energy_weight' => 'nullable|numeric|min:0|max:100',
            'max_daily_hours' => 'nullable|integer|min:4|max:10',
            'include_saturday' => 'nullable|boolean',
        ]);

        $result = $this->campaigns->generateDraft((int) $validated['filiere_id'], $validated);

        return response()->json([
            'success' => $result['success'] ?? false,
            'data' => $result,
        ], ($result['success'] ?? false) ? 200 : 422);
    }

    public function propose(int $versionId): JsonResponse
    {
        $result = $this->campaigns->propose($versionId);

        return response()->json(['success' => $result['success'], 'data' => $result], $result['success'] ? 200 : 422);
    }

    public function publishVersion(int $versionId): JsonResponse
    {
        $result = $this->campaigns->publish($versionId);

        return response()->json(['success' => $result['success'], 'data' => $result], $result['success'] ? 200 : 422);
    }
}
