<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Academic\SmartSchedulingEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmartSchedulingController extends Controller
{
    public function __construct(
        private SmartSchedulingEngine $engine
    ) {}

    /**
     * Simulation CSP en mémoire (Dry Run) avec rapport statistique et détection de conflits.
     */
    public function simulate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filiere_id'        => 'nullable|integer|exists:filieres,id',
            'semester_id'       => 'nullable|integer|exists:semesters,id',
            'energy_weight'     => 'nullable|numeric|min:0|max:100',
            'prof_avail_weight' => 'nullable|numeric|min:0|max:100',
            'max_daily_hours'   => 'nullable|integer|min:4|max:10',
        ]);

        $result = $this->engine->simulate($validated);

        return response()->json([
            'success' => true,
            'data'    => $result,
        ]);
    }

    /**
     * Génération CSP & Publication officielle dans la base de données.
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filiere_id'        => 'nullable|integer|exists:filieres,id',
            'semester_id'       => 'nullable|integer|exists:semesters,id',
            'academic_year_id'  => 'nullable|integer',
            'energy_weight'     => 'nullable|numeric|min:0|max:100',
            'prof_avail_weight' => 'nullable|numeric|min:0|max:100',
            'overwrite'         => 'nullable|boolean',
        ]);

        $result = $this->engine->generateAndPublish($validated);

        return response()->json([
            'success' => $result['success'] ?? false,
            'data'    => $result,
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
            'data'    => $stats,
        ]);
    }
}