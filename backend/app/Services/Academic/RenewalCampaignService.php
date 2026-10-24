<?php
namespace App\Services\Academic;

use App\Models\{AcademicYear, RenewalCampaign};

final class RenewalCampaignService
{
    public function forYear(AcademicYear $year): array
    {
        $campaign = RenewalCampaign::where('institution_id', $year->institution_id)->where('academic_year_id', $year->id)->first();
        $today = now('Africa/Casablanca')->toDateString();
        $state = $year->is_locked ? 'year_locked' : (! $campaign ? 'unconfigured' :
            ($campaign->status !== 'open' ? $campaign->status :
                ($today < $campaign->opens_on->toDateString() ? 'scheduled' : ($today > $campaign->closes_on->toDateString() ? 'expired' : 'open'))));
        $messages = ['unconfigured' => 'La scolarité doit publier le calendrier de réinscription.',
            'year_locked' => 'L’année universitaire est verrouillée.', 'draft' => 'La campagne de réinscription est en préparation.',
            'closed' => 'La campagne de réinscription est fermée.', 'scheduled' => 'La campagne de réinscription n’est pas encore ouverte.',
            'expired' => 'La date limite de réinscription est dépassée.', 'open' => 'La campagne de réinscription est ouverte.'];

        return ['academic_year_id' => $year->id, 'academic_year' => $year->label, 'status' => $campaign?->status ?? 'draft',
            'state' => $state, 'is_open' => $state === 'open', 'opens_on' => $campaign?->opens_on?->toDateString(),
            'closes_on' => $campaign?->closes_on?->toDateString(), 'public_message' => $campaign?->public_message,
            'message' => $messages[$state], 'timezone' => 'Africa/Casablanca', 'version' => $campaign?->version ?? 0];
    }
}
