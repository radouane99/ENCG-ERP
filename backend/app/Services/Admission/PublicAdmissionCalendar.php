<?php

namespace App\Services\Admission;

use App\Models\AdmissionCampaign;

final class PublicAdmissionCalendar
{
    public function read(int $institutionId): array
    {
        $campaigns = AdmissionCampaign::where('institution_id', $institutionId)->where('status', 'open')
            ->whereDate('close_date', '>=', now(config('admissions.timezone'))->toDateString())->orderBy('open_date')->limit(50)->get();
        $visible = $campaigns->filter(fn ($campaign) => in_array($campaign->registrationState(), ['open', 'upcoming'], true))->sortBy('open_date')->values()->map(fn ($campaign) => [
            'id' => $campaign->id, 'name' => $campaign->name, 'entry_route' => $campaign->entry_route,
            'entry_semester' => $campaign->entry_semester, 'open_date' => $campaign->open_date->toDateString(),
            'close_date' => $campaign->close_date->toDateString(), 'state' => $campaign->registrationState(),
        ]);
        $nextChange = $campaigns->flatMap(fn ($campaign) => [$campaign->open_date->copy()->shiftTimezone(config('admissions.timezone'))->startOfDay(), $campaign->close_date->copy()->shiftTimezone(config('admissions.timezone'))->addDay()->startOfDay()])->filter(fn ($date) => $date->isFuture())->sort()->first();

        return ['state' => $visible->contains('state', 'open') ? 'open' : ($visible->isNotEmpty() ? 'upcoming' : 'closed'),
            'timezone' => config('admissions.timezone', 'Africa/Casablanca'), 'server_now' => now()->toIso8601String(), 'next_change_at' => $nextChange?->toIso8601String(), 'campaigns' => $visible];
    }
}
