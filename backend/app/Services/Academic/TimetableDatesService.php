<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TimetableDatesService
{
    private function context(User $user): array
    {
        abort_unless($user->institution_id, 403);
        $year = AcademicYear::where('institution_id', $user->institution_id)->where('is_current', true)->first();

        return [$user->institution_id, $year ? (string) $year->id : null];
    }

    public function get(User $user): array
    {
        [$institutionId, $yearId] = $this->context($user);
        if ($yearId === null) {
            return ['cours_start' => '', 'td_tp_start' => ''];
        }
        $settings = Institution::findOrFail($institutionId)->settings ?? [];

        return $settings['timetable_dates'][$yearId] ?? ['cours_start' => '', 'td_tp_start' => ''];
    }

    public function save(User $user, array $dates): array
    {
        [$institutionId, $yearId] = $this->context($user);
        abort_unless($yearId !== null, 422, 'Configurez une année académique active avant les dates officielles.');

        return DB::transaction(function () use ($institutionId, $yearId, $dates) {
            $institution = Institution::whereKey($institutionId)->lockForUpdate()->firstOrFail();
            $settings = $institution->settings ?? [];
            $settings['timetable_dates'][$yearId] = $dates;
            $institution->update(['settings' => $settings]);

            return $dates;
        });
    }
}
