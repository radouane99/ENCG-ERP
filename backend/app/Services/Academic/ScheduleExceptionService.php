<?php

namespace App\Services\Academic;

use App\Models\AcademicEvent;
use App\Models\Holiday;
use App\Models\ProfessorSubstitution;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class ScheduleExceptionService
{
    /**
     * @return array{isValid: bool, reason: ?string}
     */
    public function validateSlot(
        int $academicYearId,
        int $day,
        string $start,
        string $end,
        int $roomId,
        int $profId,
        int $groupId,
        ?string $date = null
    ): array {
        $base = app(ScheduleConflictService::class)->validateSlot(
            $academicYearId,
            $day,
            $start,
            $end,
            $roomId,
            $profId,
            $groupId
        );

        if (! $base['isValid']) {
            $sub = $this->activeSubstitute($profId, $date);
            if (! ($sub && str_contains((string) $base['reason'], 'Professor'))) {
                return $base;
            }
        }

        $room = Room::find($roomId);
        if ($room && (($room->is_out_of_service ?? false) || ($room->status ?? null) === 'out_of_service')) {
            return ['isValid' => false, 'reason' => 'Salle hors service.'];
        }

        if ($date) {
            $d = Carbon::parse($date)->toDateString();
            $holiday = Holiday::query()
                ->where(function ($q) use ($d) {
                    $q->whereDate('start_date', '<=', $d)->whereDate('end_date', '>=', $d);
                })
                ->when(Schema::hasColumn('holidays', 'is_active'), fn ($q) => $q->where('is_active', true))
                ->exists();
            if ($holiday) {
                return ['isValid' => false, 'reason' => 'Jour férié national.'];
            }

            $ramadan = AcademicEvent::ofType('ramadan')->currentlyActive()->first()
                ?? AcademicEvent::ofType('ramadan')->where('is_active', true)->first();
            if ($ramadan && Carbon::parse($d)->between($ramadan->start_date, $ramadan->end_date)) {
                $latest = $this->ramadanLatestEnd($ramadan);
                if (Carbon::parse($end)->format('H:i:s') > $latest) {
                    return ['isValid' => false, 'reason' => 'Créneau hors horaires Ramadan.'];
                }
            }
        }

        return ['isValid' => true, 'reason' => null];
    }

    /**
     * Latest allowed slot end during Ramadan. Only meta.latest_end is a time;
     * title/description are human-readable labels and must not be compared as hours.
     */
    private function ramadanLatestEnd(AcademicEvent $ramadan): string
    {
        $raw = is_array($ramadan->meta) ? ($ramadan->meta['latest_end'] ?? null) : null;
        if (is_string($raw) && preg_match('/^\d{1,2}:\d{2}(:\d{2})?$/', trim($raw))) {
            return Carbon::parse(trim($raw))->format('H:i:s');
        }

        return '16:00:00';
    }

    private function activeSubstitute(int $profId, ?string $date): bool
    {
        if (! Schema::hasTable('professor_substitutions') || ! $date) {
            return false;
        }

        $d = Carbon::parse($date)->toDateString();

        return ProfessorSubstitution::query()
            ->where(function ($q) use ($profId) {
                $q->where('original_professor_id', $profId);
                if (Schema::hasColumn('professor_substitutions', 'professor_id')) {
                    $q->orWhere('professor_id', $profId);
                }
            })
            ->where('start_date', '<=', $d)
            ->where('end_date', '>=', $d)
            ->exists();
    }
}
