<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdmissionCampaignController extends Controller
{
    /**
     * Liste des campagnes d'admission.
     */
    public function index(Request $request): JsonResponse
    {
        $campaigns = AdmissionCampaign::whereIn('status', ['open', 'active'])
            ->orderByDesc('id')
            ->get();

        if ($campaigns->isEmpty()) {
            $campaigns = AdmissionCampaign::orderByDesc('id')->get();
        }

        return response()->json([
            'success' => true,
            'data'    => $campaigns,
        ]);
    }

    /**
     * Candidatures d'une campagne.
     */
    public function getApplications(Request $request, $campaignId): JsonResponse
    {
        $query = Application::query();

        if ($campaignId && $campaignId !== 'all') {
            $query->where('admission_campaign_id', (int) $campaignId);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $applications = $query->orderByDesc('id')->get();

        // Enrichir avec le list_type des étudiants si manquant
        $cnes = $applications->pluck('cne')->filter()->unique();
        $studentsListType = Student::whereIn('cne', $cnes)->pluck('list_type', 'cne');

        $applications->each(function ($app) use ($studentsListType) {
            if (empty($app->list_type) && isset($studentsListType[$app->cne])) {
                $app->list_type = $studentsListType[$app->cne];
            }
        });

        $stats = [
            'total'    => $applications->count(),
            'pending'  => $applications->filter(fn($a) => str_contains(strtolower(($a->status ?? '') . ' ' . ($a->list_type ?? '')), 'attente'))->count(),
            'accepted' => $applications->filter(fn($a) => str_contains(strtolower(($a->status ?? '') . ' ' . ($a->list_type ?? '')), 'principale') || in_array($a->status, ['accepted', 'admis', 'admis_tafem', 'valide']))->count(),
            'rejected' => $applications->filter(fn($a) => in_array($a->status, ['rejected', 'rejete', 'suspended']))->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => $applications,
            'stats'   => $stats,
        ]);
    }
}