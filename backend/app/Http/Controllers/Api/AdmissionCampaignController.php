<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Support\AdmissionAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdmissionCampaignController extends Controller
{
    /**
     * Liste des campagnes d'admission.
     */
    public function index(Request $request): JsonResponse
    {
        AdmissionAccess::review($request);
        $campaigns = AdmissionCampaign::where('institution_id', AdmissionAccess::institution($request))->whereIn('status', ['open', 'active'])
            ->orderByDesc('id')
            ->get();

        if ($campaigns->isEmpty()) {
            $campaigns = AdmissionCampaign::where('institution_id', AdmissionAccess::institution($request))->orderByDesc('id')->get();
        }

        return response()->json([
            'success' => true,
            'data' => $campaigns,
        ]);
    }

    /**
     * Candidatures d'une campagne.
     */
    public function getApplications(Request $request, $campaignId): JsonResponse
    {
        $request->merge(['campaign_id' => $campaignId]);

        return app(AdmissionWorkflowController::class)->listing($request);
    }

    public function tafemStats(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->stats($request);
    }

    public function autoRepartition(Request $request, int $campaign): JsonResponse
    {
        $request->merge(['campaign_id' => $campaign]);

        return app(AdmissionAppointmentController::class)->preview($request);
    }

    public function exportPdf(Request $request, int $campaign, string $type)
    {
        $request->merge(['campaign_id' => $campaign, 'type' => $type]);

        return app(AdmissionWorkflowPdfController::class)->list($request);
    }

    public function calculateSeuil(Request $request, int $campaign): JsonResponse
    {
        AdmissionAccess::review($request);
        $request->merge(['campaign_id' => $campaign]);
        $c = AdmissionAccess::campaign($request);
        $score = Application::where('admission_campaign_id', $c->id)->where('eligibility', 'main')->whereNotNull('official_rank_source')->min('selection_score');

        return response()->json(['threshold' => $score, 'source' => 'official_import', 'message' => 'Seuil constaté dans la liste officielle ; aucun reclassement automatique.']);
    }
}
