<?php

namespace App\Domain\Admission\Repositories;

use App\Domain\Core\Repositories\BaseRepository;
use App\Models\Application;
use Illuminate\Pagination\LengthAwarePaginator;

class ApplicationRepository extends BaseRepository
{
    public function __construct(Application $model)
    {
        parent::__construct($model);
    }

    /**
     * Get paginated applications for a specific campaign, with optional filtering.
     */
    public function getApplicationsForCampaign(int $campaignId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->query()->where('admission_campaign_id', $campaignId);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('cin', 'like', "%{$search}%")
                  ->orWhere('cne', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        // Default sorting by selection score descending
        $query->orderByDesc('selection_score');

        return $query->paginate($perPage);
    }

    /**
     * Rank applications for a campaign based on their selection score.
     */
    public function rankApplications(int $campaignId): void
    {
        $applications = $this->query()
            ->where('admission_campaign_id', $campaignId)
            ->whereNotNull('selection_score')
            ->orderByDesc('selection_score')
            ->get();

        $rank = 1;
        foreach ($applications as $app) {
            $app->update(['ranking' => $rank++]);
        }
    }
}
