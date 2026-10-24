<?php
namespace App\Actions\Academic;

use App\Models\{AcademicYear, RenewalCampaign, User};
use App\Support\AdmissionAccess;
use Illuminate\Support\Facades\DB;

final class SaveRenewalCampaignAction
{
    public function execute(User $actor, array $data): RenewalCampaign
    {
        abort_unless(AdmissionAccess::staff($actor), 403);
        return DB::transaction(function () use ($actor, $data) {
            $year = AcademicYear::where('institution_id', $actor->institution_id)->where('is_current', true)->lockForUpdate()->firstOrFail();
            abort_if($year->is_locked, 422, 'Année verrouillée : calendrier non modifiable.');
            $campaign = RenewalCampaign::where('institution_id', $actor->institution_id)->where('academic_year_id', $year->id)->lockForUpdate()->first();
            abort_unless((int) $data['version'] === (int) ($campaign?->version ?? 0), 409, 'Calendrier modifié par un autre agent. Actualisez avant de réessayer.');
            $campaign ??= new RenewalCampaign(['institution_id' => $actor->institution_id, 'academic_year_id' => $year->id]);
            $campaign->fill(collect($data)->only(['status', 'opens_on', 'closes_on', 'public_message'])->all());
            $campaign->version = $campaign->exists ? $campaign->version + 1 : 1;
            $campaign->updated_by = $actor->id;
            $campaign->save();
            activity()->causedBy($actor)->performedOn($campaign)->withProperties(['academic_year_id' => $year->id, 'status' => $campaign->status,
                'opens_on' => $campaign->opens_on->toDateString(), 'closes_on' => $campaign->closes_on->toDateString()])->log('renewal_campaign_updated');
            return $campaign;
        });
    }
}
