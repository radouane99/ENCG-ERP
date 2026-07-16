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
}
