<?php

namespace App\Services\Academic;

use App\Models\Application;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AdmissionService
{
    private const VALID_STATUSES = ['pending', 'accepted', 'waitlisted', 'rejected'];

    /**
     * Récupérer les candidatures d'une campagne.
     */
    public function getApplicationsForCampaign(?int $campaignId = null): Collection
    {
        $query = Application::latest();

        if ($campaignId && $campaignId > 0) {
            $query->where(function ($q) use ($campaignId) {
                $q->where('admission_campaign_id', $campaignId)
                    ->orWhere('campaign_id', $campaignId);
            });
        }

        return $query->get();
    }

    /**
     * Mettre à jour le statut d'une candidature.
     */
    public function updateApplicationStatus(int $applicationId, string $status): Application
    {
        if (! in_array($status, self::VALID_STATUSES)) {
            throw new \InvalidArgumentException("Statut invalide : {$status}");
        }

        return DB::transaction(function () use ($applicationId, $status) {
            $application = Application::findOrFail($applicationId);
            $application->update(['status' => $status]);

            return $application;
        });
    }

    /**
     * Mettre à jour le statut en masse.
     */
    public function bulkUpdateStatus(array $applicationIds, string $status): int
    {
        if (! in_array($status, self::VALID_STATUSES)) {
            throw new \InvalidArgumentException("Statut invalide : {$status}");
        }

        return DB::transaction(fn () => Application::whereIn('id', $applicationIds)->update(['status' => $status]));
    }
}
