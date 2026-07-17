<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\AdmissionService;

class AdmissionController extends Controller
{
    protected AdmissionService $admissionService;

    public function __construct(AdmissionService $admissionService)
    {
        $this->admissionService = $admissionService;
    }

    /**
     * Display a listing of applications for a specific campaign.
     */
    public function index($campaignId): JsonResponse
    {
        $applications = $this->admissionService->getApplicationsForCampaign((int) $campaignId);
        
        $stats = [
            'total' => $applications->count(),
            'pending' => $applications->where('status', 'pending')->count(),
            'accepted' => $applications->where('status', 'accepted')->count(),
            'rejected' => $applications->where('status', 'rejected')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $applications,
            'stats' => $stats
        ]);
    }

    /**
     * Update the status of a specific application.
     */
    public function updateStatus(Request $request, $applicationId): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,accepted,waitlisted,rejected'
        ]);

        try {
            $application = $this->admissionService->updateApplicationStatus((int) $applicationId, $validated['status']);
            
            return response()->json([
                'success' => true,
                'message' => 'Statut de la candidature mis à jour avec succès.',
                'data' => $application
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Delete an application (if necessary, though updating to 'rejected' is preferred).
     */
    public function destroy($applicationId): JsonResponse
    {
        $application = \App\Models\Application::findOrFail($applicationId);
        $application->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Candidature supprimée avec succès.'
        ]);
    }
}
