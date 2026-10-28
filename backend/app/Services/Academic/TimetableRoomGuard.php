<?php

namespace App\Services\Academic;

use App\Models\Group;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\Schedule;
use App\Models\Semester;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Salles adaptées à l'effectif + occupation réelle (EDT + réservations).
 */
class TimetableRoomGuard
{
    public function requiredRoomType(string $moduleName, string $sessionType, int $headcount): string
    {
        return $sessionType === 'tp' || str_contains(mb_strtolower($moduleName), 'informatique') ? 'lab' : ($headcount > 50 ? 'amphitheater' : 'classroom');
    }

    public function isAmphitheater(object $room): bool
    {
        $type = strtolower((string) ($room->type ?? ''));
        $name = strtolower((string) ($room->name ?? ''));

        return str_contains($type, 'amphi') || str_contains($name, 'amphi');
    }

    public function isTeachingRoom(object $room): bool
    {
        $type = strtolower((string) ($room->type ?? 'classroom'));

        return in_array($type, ['classroom', 'td', 'salle', 'lab', 'laboratory', 'tp'], true)
            || (! $this->isAmphitheater($room) && $type !== 'conference');
    }

    public function roomOperational(object $room): bool
    {
        if (($room->is_out_of_service ?? false) === true) {
            return false;
        }
        if (($room->status ?? null) === 'out_of_service') {
            return false;
        }

        return ($room->is_available ?? true) !== false;
    }

    public function headcountFor(array $var): int
    {
        $size = (int) ($var['group_size'] ?? 0);
        if ($size > 0) {
            return $size;
        }

        return max(1, count(TimetablePerformanceStrategy::occupiedGroupIds($var))) * 35;
    }

    public function isSharedCours(array $var): bool
    {
        $type = (string) ($var['session_type'] ?? 'cm');

        return TimetablePerformanceStrategy::isCoursMagistral($type)
            && count(TimetablePerformanceStrategy::occupiedGroupIds($var)) > 1;
    }

    public function roomFits(object $room, array $var, Collection $allRooms): bool
    {
        if (! $this->roomOperational($room)) {
            return false;
        }

        $headcount = $this->headcountFor($var);
        $capacity = (int) ($room->capacity ?? 0);
        if ($capacity < $headcount) {
            return false;
        }
        if (($var['required_type'] ?? '') === 'lab' && ! in_array(strtolower((string) ($room->type ?? '')), ['lab', 'laboratory', 'tp', 'computer_lab', 'informatique'], true)) {
            return false;
        }

        if ((string) ($var['required_type'] ?? '') === 'amphitheater') {
            return $this->isAmphitheater($room) || $capacity >= max(100, $headcount);
        }

        // Reserve computer laboratories for sessions that actually require computers.
        if (($var['required_type'] ?? '') !== 'lab' && in_array(strtolower((string) ($room->type ?? '')), ['lab', 'laboratory', 'tp', 'computer_lab', 'informatique'], true)) {
            return false;
        }
        $smallEnough = $this->isTeachingRoom($room) && ! $this->isAmphitheater($room);
        $hasSmall = $allRooms->contains(fn ($candidate) => $this->roomOperational($candidate)
            && $this->isTeachingRoom($candidate)
            && ! $this->isAmphitheater($candidate)
            && ! in_array(strtolower((string) ($candidate->type ?? '')), ['lab', 'laboratory', 'tp', 'computer_lab', 'informatique'], true)
            && (int) ($candidate->capacity ?? 0) >= $headcount);

        if ($hasSmall) {
            return $smallEnough;
        }

        return true;
    }

    public function feasibleRooms(array $var, Collection $rooms): Collection
    {
        return $rooms
            ->filter(fn ($room) => $this->roomFits($room, $var, $rooms))
            ->sortBy(fn ($room) => (int) ($room->capacity ?? 9999))
            ->values();
    }

    public function seedOccupancy(TimetableOccupancyGrid $grid, array $exceptScheduleIds = []): void
    {
        $except = array_values(array_filter(array_map('intval', $exceptScheduleIds)));

        if (Schema::hasTable('schedules')) {
            $query = Schedule::query()->where('day_of_week', '>=', 1)
                ->where('academic_year_id', AcademicContext::yearId())
                ->where('institution_id', auth()->user()?->institution_id ?? config('erp.institution_id', 1));
            $semester = Semester::where('academic_year_id', AcademicContext::yearId())->where('is_current', true)->first();
            if ($semester) {
                $query->whereHas('module', fn ($q) => $q->whereRaw('MOD(semester_number, 2) = ?', [$semester->number % 2]));
            }
            if ($except !== []) {
                $query->whereNotIn('id', $except);
            }
            $query->where(function ($q) {
                $q->where('is_active', true);
                if (Schema::hasColumn('schedules', 'schedule_version_id')) {
                    $q->orWhereHas('version', fn ($v) => $v->whereIn('status', ['DRAFT', 'PROPOSED', 'PUBLISHED']));
                }
            });

            foreach ($query->get(['id', 'day_of_week', 'start_time', 'end_time', 'professor_id', 'group_id', 'room_id']) as $row) {
                if (! $row->room_id) {
                    continue;
                }
                $grid->occupy(
                    (int) $row->day_of_week,
                    0,
                    substr((string) $row->start_time, 0, 8),
                    substr((string) $row->end_time, 0, 8),
                    $row->professor_id ?: 'ext',
                    [(int) $row->group_id],
                    $row->room_id
                );
            }
        }

        if (! Schema::hasTable('room_bookings')) {
            return;
        }

        $bookings = RoomBooking::query()
            ->whereIn('status', ['pending', 'approved'])
            ->get();

        foreach ($bookings as $booking) {
            $start = $booking->start_time;
            $end = $booking->end_time;
            if (! $start || ! $end) {
                continue;
            }
            $roomId = $booking->room_id;
            if (! $roomId && $booking->room_name) {
                $roomId = Room::query()->where('name', $booking->room_name)->value('id');
            }
            if (! $roomId) {
                continue;
            }
            $day = (int) $start->dayOfWeekIso;
            if ($day < 1 || $day > 7) {
                continue;
            }
            $grid->occupy(
                $day,
                0,
                $start->format('H:i:s'),
                $end->format('H:i:s'),
                'booking:'.$booking->id,
                ['booking'],
                $roomId
            );
        }
    }

    public function roomBusyInWorld(int $roomId, int $day, string $start, string $end, array $exceptScheduleIds = []): bool
    {
        $grid = new TimetableOccupancyGrid;
        $this->seedOccupancy($grid, $exceptScheduleIds);

        return $grid->roomBusy($day, $start, $end, $roomId);
    }

    public function isRoomBusyAt(string $roomId, \DateTimeInterface $start, \DateTimeInterface $end, ?int $exceptBookingId = null): bool
    {
        $room = Room::query()->find($roomId);
        if (! $room || ! $this->roomOperational($room)) {
            return true;
        }

        $start = Carbon::parse($start);
        $end = Carbon::parse($end);
        $grid = $this->gridForInstant($start, $end, $exceptBookingId);

        return $grid->roomBusy(
            (int) $start->dayOfWeekIso,
            $start->format('H:i:s'),
            $end->format('H:i:s'),
            $roomId
        );
    }

    public function groupsHeadcount(array $groupIds): int
    {
        if ($groupIds === []) {
            return 0;
        }

        return array_sum($this->groupHeadcounts($groupIds));
    }

    /** Validated current-year enrolments take precedence over a group's capacity ceiling. */
    public function groupHeadcounts(array $groupIds): array
    {
        $counts = DB::table('student_registrations as r')->join('groups as g', 'g.id', '=', 'r.group_id')
            ->whereIn('g.id', $groupIds)->whereColumn('r.academic_year_id', 'g.academic_year_id')
            ->whereIn('r.status', ['academic_validated', 'admin_validated'])
            ->selectRaw('g.id, count(distinct r.student_id) as total')->groupBy('g.id')->pluck('total', 'id');

        return Group::whereIn('id', $groupIds)->get()->mapWithKeys(fn ($group) => [$group->id => (int) ($counts[$group->id] ?? ($group->capacity ?: 35))])->all();
    }

    /**
     * Salles libres pour une séance ponctuelle (extra, rattrapage) à une date précise.
     *
     * @return array{available: list<array<string, mixed>>, occupied: list<array<string, mixed>>}
     */
    public function availableRooms(\DateTimeInterface $start, \DateTimeInterface $end, int $minCapacity = 0, string $kind = 'all'): array
    {
        $start = Carbon::parse($start);
        $end = Carbon::parse($end);
        $grid = $this->gridForInstant($start, $end);
        $day = (int) $start->dayOfWeekIso;
        $tStart = $start->format('H:i:s');
        $tEnd = $end->format('H:i:s');

        $available = [];
        $occupied = [];

        foreach (Room::query()->orderBy('capacity')->get() as $room) {
            if ((int) $room->institution_id !== (int) (auth()->user()?->institution_id ?? config('erp.institution_id', 1))) {
                continue;
            }
            if (! $this->roomOperational($room)) {
                $occupied[] = $this->roomPayload($room, 'Hors service');

                continue;
            }
            if ($minCapacity > 0 && (int) $room->capacity < $minCapacity) {
                $occupied[] = $this->roomPayload($room, 'Capacité insuffisante ('.$room->capacity.' < '.$minCapacity.')');

                continue;
            }
            if ($kind === 'amphi' && ! $this->isAmphitheater($room)) {
                continue;
            }
            if ($kind === 'td' && $this->isAmphitheater($room)) {
                continue;
            }
            if ($grid->roomBusy($day, $tStart, $tEnd, $room->id)) {
                $occupied[] = $this->roomPayload($room, 'Déjà prise (EDT ou réservation) sur ce créneau');

                continue;
            }
            $available[] = $this->roomPayload($room, null);
        }

        return [
            'date' => $start->toDateString(),
            'start_time' => $tStart,
            'end_time' => $tEnd,
            'day_of_week' => $day,
            'min_capacity' => $minCapacity,
            'available' => $available,
            'occupied' => $occupied,
            'available_count' => count($available),
        ];
    }

    public function isProfessorBusyAt(int $professorId, Carbon $start, Carbon $end): bool
    {
        return $this->gridForInstant($start, $end)->professorBusy($start->dayOfWeekIso, $start->format('H:i:s'), $end->format('H:i:s'), $professorId);
    }

    private function gridForInstant(Carbon $start, Carbon $end, ?int $exceptBookingId = null): TimetableOccupancyGrid
    {
        $grid = new TimetableOccupancyGrid;
        $day = (int) $start->dayOfWeekIso;
        $tStart = $start->format('H:i:s');
        $tEnd = $end->format('H:i:s');

        if (Schema::hasTable('schedules') && $day >= 1 && $day <= 6) {
            $query = Schedule::query()
                ->where('institution_id', auth()->user()?->institution_id ?? config('erp.institution_id', 1))
                ->whereHas('academicYear', fn ($q) => $q->whereDate('start_date', '<=', $start->toDateString())->whereDate('end_date', '>=', $start->toDateString()))
                ->where('day_of_week', $day)
                ->whereTime('start_time', '<', $tEnd)
                ->whereTime('end_time', '>', $tStart);
            $query->where(function ($q) {
                $q->where('is_active', true);
                if (Schema::hasColumn('schedules', 'schedule_version_id')) {
                    $q->orWhereHas('version', fn ($v) => $v->whereIn('status', ['DRAFT', 'PROPOSED', 'PUBLISHED']));
                }
            });
            foreach ($query->get(['professor_id', 'group_id', 'room_id', 'start_time', 'end_time', 'day_of_week']) as $row) {
                if (! $row->room_id) {
                    continue;
                }
                $grid->occupy(
                    $day,
                    0,
                    substr((string) $row->start_time, 0, 8),
                    substr((string) $row->end_time, 0, 8),
                    $row->professor_id ?: 'edt',
                    [(int) $row->group_id],
                    $row->room_id
                );
            }
        }

        if (Schema::hasTable('room_bookings')) {
            $bookings = RoomBooking::query()
                ->when($exceptBookingId, fn ($q) => $q->where('id', '!=', $exceptBookingId))
                ->whereIn('status', ['pending', 'approved'])
                ->where('start_time', '<', $end)
                ->where('end_time', '>', $start)
                ->get();
            foreach ($bookings as $booking) {
                $roomId = $booking->room_id;
                if (! $roomId && $booking->room_name) {
                    $roomId = Room::query()->where('name', $booking->room_name)->value('id');
                }
                if (! $roomId) {
                    continue;
                }
                $grid->occupy(
                    $day,
                    0,
                    $booking->start_time->format('H:i:s'),
                    $booking->end_time->format('H:i:s'),
                    'booking:'.$booking->id,
                    ['booking'],
                    $roomId
                );
            }
        }

        if (Schema::hasTable('deliberation_meetings')) {
            foreach (DB::table('deliberation_meetings')->where('starts_at', '<', $end)->where('ends_at', '>', $start)->get() as $meeting) {
                $grid->occupy($day, 0, Carbon::parse($meeting->starts_at)->format('H:i:s'), Carbon::parse($meeting->ends_at)->format('H:i:s'), 'jury:'.$meeting->id, [], $meeting->room_id);
            }
        }

        return $grid;
    }

    private function roomPayload(Room $room, ?string $reason): array
    {
        return [
            'id' => $room->id,
            'name' => $room->name,
            'code' => $room->code,
            'type' => $room->type,
            'capacity' => (int) $room->capacity,
            'is_amphitheater' => $this->isAmphitheater($room),
            'reason' => $reason,
        ];
    }
}
