<?php

namespace App\Services\Academic;

/**
 * O(1) occupancy indexes for hard EDT constraints: professeur, salle, groupe.
 */
class TimetableOccupancyGrid
{
    /** @var array<string, bool> */
    private array $professors = [];

    /** @var array<string, bool> */
    private array $groups = [];

    /** @var array<string, bool> */
    private array $rooms = [];

    /** @var array<string, int> */
    private array $profDayLoad = [];

    /** @var array<string, int> */
    private array $groupDayLoad = [];

    /** @var array<string, int> */
    private array $slotFill = [];

    public function key(int $day, int $slot): string
    {
        return $day.':'.$slot;
    }

    public function occupy(int $day, int $slot, int|string $professorId, int|string $groupId, int|string $roomId): void
    {
        $slotKey = $this->key($day, $slot);
        $this->professors[$slotKey.':'.$professorId] = true;
        $this->groups[$slotKey.':'.$groupId] = true;
        $this->rooms[$slotKey.':'.$roomId] = true;
        $this->profDayLoad[$day.':'.$professorId] = ($this->profDayLoad[$day.':'.$professorId] ?? 0) + 1;
        $this->groupDayLoad[$day.':'.$groupId] = ($this->groupDayLoad[$day.':'.$groupId] ?? 0) + 1;
        $this->slotFill[$slotKey] = ($this->slotFill[$slotKey] ?? 0) + 1;
    }

    public function professorBusy(int $day, int $slot, int|string $professorId): bool
    {
        return isset($this->professors[$this->key($day, $slot).':'.$professorId]);
    }

    public function groupBusy(int $day, int $slot, int|string $groupId): bool
    {
        return isset($this->groups[$this->key($day, $slot).':'.$groupId]);
    }

    public function roomBusy(int $day, int $slot, int|string $roomId): bool
    {
        return isset($this->rooms[$this->key($day, $slot).':'.$roomId]);
    }

    public function professorDaySlots(int $day, int|string $professorId): int
    {
        return $this->profDayLoad[$day.':'.$professorId] ?? 0;
    }

    public function groupDaySlots(int $day, int|string $groupId): int
    {
        return $this->groupDayLoad[$day.':'.$groupId] ?? 0;
    }

    public function slotOccupancy(int $day, int $slot): int
    {
        return $this->slotFill[$this->key($day, $slot)] ?? 0;
    }

    public function resourcesFree(int $day, int $slot, int|string $professorId, int|string $groupId, int|string $roomId): bool
    {
        return ! $this->professorBusy($day, $slot, $professorId)
            && ! $this->groupBusy($day, $slot, $groupId)
            && ! $this->roomBusy($day, $slot, $roomId);
    }
}
