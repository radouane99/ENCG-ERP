<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdmissionCampaignController extends Controller
{
    /**
     * Get active admission campaigns.
     */
    public function index(Request $request): JsonResponse
    {
        $campaigns = AdmissionCampaign::where('status', 'open')
            ->orWhere('status', 'active')
            ->orderBy('id', 'desc')
            ->get();

        if ($campaigns->isEmpty()) {
            $campaigns = AdmissionCampaign::orderBy('id', 'desc')->get();
        }

        return response()->json([
            'success' => true,
            'data' => $campaigns,
        ]);
    }

    /**
     * Get applications for a campaign.
     */
    public function getApplications(Request $request, $campaignId): JsonResponse
    {
        $query = Application::query();

        if ($campaignId && $campaignId !== 'all') {
            $query->where('admission_campaign_id', $campaignId);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $applications = $query->orderBy('id', 'desc')->get()->map(function ($app) {
            if (empty($app->list_type)) {
                $student = \App\Models\Student::where('cne', $app->cne)->first();
                if ($student && !empty($student->list_type)) {
                    $app->list_type = $student->list_type;
                }
            }
            return $app;
        });

        $stats = [
            'total' => $applications->count(),
            'pending' => $applications->filter(fn($a) => str_contains(strtolower(($a->status ?? '') . ' ' . ($a->list_type ?? '')), 'attente'))->count(),
            'accepted' => $applications->filter(fn($a) => str_contains(strtolower(($a->status ?? '') . ' ' . ($a->list_type ?? '')), 'principale') || in_array($a->status, ['accepted', 'admis', 'admis_tafem', 'valide']))->count(),
            'rejected' => $applications->filter(fn($a) => in_array($a->status, ['rejected', 'rejete', 'suspended']))->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $applications,
            'stats' => $stats,
        ]);
    }
}
