<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Admissions\AdmissionEngine;

class AdmissionCampaignController extends Controller
{
    protected AdmissionEngine $engine;

    public function __construct(AdmissionEngine $engine)
    {
        $this->engine = $engine;
    }

    /**
     * Trigger Seuil calculation and ranking
     */
    public function calculateSeuil(int $campaignId): JsonResponse
    {
        try {
            $data = $this->engine->calculateSeuilAndRank($campaignId);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul du seuil: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * List admission campaigns
     */
    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\AdmissionCampaign::query();
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $campaigns = $query->orderBy('created_at', 'desc')->get();

        // If no active campaign exists, create a default one to ensure UI doesn't break
        if ($campaigns->isEmpty() && $request->status === 'active') {
            $campaigns = collect([\App\Models\AdmissionCampaign::create([
                'name' => 'Campagne d\'Admission ' . date('Y'),
                'academic_year_id' => 1,
                'status' => 'active',
                'start_date' => now(),
                'end_date' => now()->addMonths(2),
                'seuil_national' => null,
                'seuil_regional' => null,
                'type' => 'tafem',
            ])]);
        }

        return response()->json(['success' => true, 'data' => $campaigns]);
    }
}
