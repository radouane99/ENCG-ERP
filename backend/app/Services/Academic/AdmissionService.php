<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;
use App\Models\Application;
use Illuminate\Database\Eloquent\Collection;

class AdmissionService
{
    /**
     * Get applications for a specific campaign with eager loading.
     */
    public function getApplicationsForCampaign(int $campaignId): Collection
    {
        return Application::where('campaign_id', $campaignId)
            // ->with('candidate') // Assuming candidate relationship exists
            ->latest()
            ->get();
    }

    /**
     * Update the status of an application.
     */
    public function updateApplicationStatus(int $applicationId, string $status): Application
    {
        $validStatuses = ['pending', 'accepted', 'waitlisted', 'rejected'];
        
        if (!in_array($status, $validStatuses)) {
            throw new \InvalidArgumentException("Invalid status provided.");
        }

        return DB::transaction(function () use ($applicationId, $status) {
            $application = Application::findOrFail($applicationId);
            $application->status = $status;
            
            // Here we could add logic like:
            // if ($status === 'accepted') { $this->createStudentProfile($application); }
            
            $application->save();

            return $application;
        });
    }

    /**
     * Bulk update application statuses (e.g. accepting top 100).
     */
    public function bulkUpdateStatus(array $applicationIds, string $status): int
    {
        return DB::transaction(function () use ($applicationIds, $status) {
            return Application::whereIn('id', $applicationIds)->update(['status' => $status]);
        });
    }
}
