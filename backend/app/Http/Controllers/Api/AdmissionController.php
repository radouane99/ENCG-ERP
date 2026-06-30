<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\AdmissionCampaign;
use App\Domain\Admission\Repositories\ApplicationRepository;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdmissionController extends Controller
{
    private ApplicationRepository $applicationRepository;

    public function __construct(ApplicationRepository $applicationRepository)
    {
        $this->applicationRepository = $applicationRepository;
    }

    /**
     * Get a paginated list of applications for a given campaign.
     */
    public function index(Request $request, AdmissionCampaign $campaign): JsonResponse
    {
        // Simple authorization check (could use Policies)
        if (!$request->user()->can('manage admissions')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $filters = $request->only(['status', 'search']);
        $applications = $this->applicationRepository->getApplicationsForCampaign(
            $campaign->id,
            $filters,
            $request->get('per_page', 15)
        );

        return response()->json($applications);
    }

    /**
     * Accept or reject an application.
     */
    public function updateStatus(Request $request, Application $application): JsonResponse
    {
        if (!$request->user()->can('manage admissions')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:accepted,rejected,waiting_list',
            'rejection_reason' => 'required_if:status,rejected|string|nullable'
        ]);

        $this->applicationRepository->update($application->id, [
            'status' => $validated['status'],
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Application status updated successfully',
            'application' => $application->fresh()
        ]);
    }
}
