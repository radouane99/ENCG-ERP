<?php

namespace App\Services\Admissions;

use Illuminate\Support\Facades\DB;
use Exception;

class AdmissionEngine
{
    /**
     * Calculate Selection Score (Seuil) and Rank applicants
     * TAFEM Logic: 75% Bac National + 25% Bac Regional
     */
    public function calculateSeuilAndRank(int $campaignId): array
    {
        $campaign = DB::table('admission_campaigns')->find($campaignId);
        if (!$campaign) {
            throw new Exception("Campagne d'admission introuvable.");
        }

        // Fetch all submitted applications
        $applications = DB::table('applications')
            ->join('users', 'applications.user_id', '=', 'users.id') // Candidates are users with role 'candidate'
            ->where('campaign_id', $campaignId)
            ->where('applications.status', 'submitted')
            ->select('applications.id', 'applications.bac_national_score', 'applications.bac_regional_score', 'users.first_name', 'users.last_name')
            ->get();

        if ($applications->isEmpty()) {
            throw new Exception("Aucune candidature soumise pour cette campagne.");
        }

        $rankedApplications = [];

        // 1. Calculate Score for each application
        foreach ($applications as $app) {
            // Seuil Formula ENCG: 0.75 * National + 0.25 * Regional
            $score = ($app->bac_national_score * 0.75) + ($app->bac_regional_score * 0.25);
            
            $rankedApplications[] = [
                'application_id' => $app->id,
                'first_name' => $app->first_name,
                'last_name' => $app->last_name,
                'score' => round($score, 3)
            ];
        }

        // 2. Sort by score descending
        usort($rankedApplications, fn($a, $b) => $b['score'] <=> $a['score']);

        // 3. Determine Threshold (Seuil) based on target capacity
        $targetCapacity = $campaign->target_capacity ?? 100;
        
        // Let's say we invite 4 times the capacity to the written exam
        $invitedCount = min(count($rankedApplications), $targetCapacity * 4);
        
        // The seuil is the score of the last invited person
        $seuil = 0;
        if ($invitedCount > 0) {
            $seuil = $rankedApplications[$invitedCount - 1]['score'];
        }

        // 4. Update Database Statuses
        DB::beginTransaction();
        try {
            foreach ($rankedApplications as $index => $app) {
                $rank = $index + 1;
                $status = ($rank <= $invitedCount) ? 'accepted' : 'rejected'; // 'accepted' means accepted for written exam (Présélectionné)

                DB::table('applications')->where('id', $app['application_id'])->update([
                    'selection_score' => $app['score'],
                    'rank' => $rank,
                    'status' => $status,
                    'updated_at' => now()
                ]);
            }
            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw new Exception("Erreur lors de la mise à jour des candidatures.");
        }

        return [
            'success' => true,
            'campaign_name' => $campaign->name,
            'total_candidates' => count($rankedApplications),
            'target_capacity' => $targetCapacity,
            'invited_to_exam' => $invitedCount,
            'seuil_calculated' => $seuil,
            'top_candidates' => array_slice($rankedApplications, 0, 10)
        ];
    }
}
