<?php

namespace App\Services\Academic;

/**
 * Occupation par intervalle (pas seulement par créneau étiquette).
 * 08:30–10:30 et 09:30–11:30 se chevauchent donc bloquent professeur / salle / groupes.
 */
class TimetableOccupancyGrid
{
    /** @var array<int, array{day: int, start: int, end: int, professor_id: int|string, group_ids: array<int|string>, room_id: int|string}> */
    private array $bookings = [];

    /** @var array<string, int> */
    private array $profDayLoad = [];

    /** @var array<string, int> */
    private array $groupDayLoad = [];

    /** @var array<string, int> */
    private array $slotFill = [];

    public static function minutes(string $time): int
    {
        $parts = array_map('intval', explode(':', substr($time, 0, 8)));

        return (($parts[0] ?? 0) * 60) + ($parts[1] ?? 0);
    }

    public static function intervalsOverlap(int $startA, int $endA, int $startB, int $endB): bool
    {
        return $startA < $endB && $startB < $endA;
    }

    public function occupy(
        int $day,
        int $slot,
        string $start,
        string $end,
        int|string $professorId,
        array $groupIds,
        int|string $roomId
    ): void {
        $this->bookings[] = [
            'day' => $day,
            'start' => self::minutes($start),
            'end' => self::minutes($end),
            'professor_id' => $professorId,
            'group_ids' => array_values(array_unique($groupIds)),
            'room_id' => $roomId,
        ];

        $this->profDayLoad[$day.':'.$professorId] = ($this->profDayLoad[$day.':'.$professorId] ?? 0) + 1;
        foreach ($groupIds as $groupId) {
            $this->groupDayLoad[$day.':'.$groupId] = ($this->groupDayLoad[$day.':'.$groupId] ?? 0) + 1;
        }
        $slotKey = $day.':'.$slot;
        $this->slotFill[$slotKey] = ($this->slotFill[$slotKey] ?? 0) + 1;
    }

    public function professorBusy(int $day, string $start, string $end, int|string $professorId): bool
    {
        $s = self::minutes($start);
        $e = self::minutes($end);
        foreach ($this->bookings as $booking) {
            if ($booking['day'] !== $day || (string) $booking['professor_id'] !== (string) $professorId) {
                continue;
            }
            if (self::intervalsOverlap($s, $e, $booking['start'], $booking['end'])) {
                return true;
            }
        }

        return false;
    }

    public function groupBusy(int $day, string $start, string $end, int|string $groupId): bool
    {
        $s = self::minutes($start);
        $e = self::minutes($end);
        foreach ($this->bookings as $booking) {
            if ($booking['day'] !== $day) {
                continue;
            }
            if (! in_array($groupId, $booking['group_ids'], false) && ! in_array((string) $groupId, array_map('strval', $booking['group_ids']), true)) {
                continue;
            }
            if (self::intervalsOverlap($s, $e, $booking['start'], $booking['end'])) {
                return true;
            }
        }

        return false;
    }

    public function groupsBusy(int $day, string $start, string $end, array $groupIds): bool
    {
        foreach ($groupIds as $groupId) {
            if ($this->groupBusy($day, $start, $end, $groupId)) {
                return true;
            }
        }

        return false;
    }

    public function roomBusy(int $day, string $start, string $end, int|string $roomId): bool
    {
        $s = self::minutes($start);
        $e = self::minutes($end);
        foreach ($this->bookings as $booking) {
            if ($booking['day'] !== $day || (string) $booking['room_id'] !== (string) $roomId) {
                continue;
            }
            if (self::intervalsOverlap($s, $e, $booking['start'], $booking['end'])) {
                return true;
            }
        }

        return false;
    }

    public function professorDaySlots(int $day, int|string $professorId): int
    {
        return $this->profDayLoad[$day.':'.$professorId] ?? 0;
    }

    public function groupDaySlots(int $day, int|string $groupId): int
    {
        return $this->groupDayLoad[$day.':'.$groupId] ?? 0;
    }

    public function maxGroupDaySlots(int $day, array $groupIds): int
    {
        $max = 0;
        foreach ($groupIds as $groupId) {
            $max = max($max, $this->groupDaySlots($day, $groupId));
        }

        return $max;
    }

    public function slotOccupancy(int $day, int $slot): int
    {
        return $this->slotFill[$day.':'.$slot] ?? 0;
    }
}
