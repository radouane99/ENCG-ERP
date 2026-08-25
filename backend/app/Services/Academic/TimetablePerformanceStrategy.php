<?php

namespace App\Services\Academic;

use App\Models\ProfessorAvailability;
use Illuminate\Support\Collection;

/**
 * Stratégie de performance EDT ENCG :
 * - Contraintes dures : 1 professeur, 1 salle, 1 groupe par créneau.
 * - Heuristiques : MRV (domaine minimal), Degree (ressources partagées), LCV (créneau le moins saturé).
 * - Charge : plafond d'heures / jour, salles smallest-fit, clustering bâtiment.
 */
class TimetablePerformanceStrategy
{
    public const NAME = 'MRV-Degree-LCV';

    /** @var array<int, int> */
    private array $workingDays = [1, 2, 3, 4, 5];

    public const HEURISTICS = [
        'CM — un cours pour les 2 groupes de la promotion (même prof, même salle, même horaire)',
        'TD — séance séparée par groupe (peuvent être en parallèle si profs et salles distincts)',
        'Chevauchement — 08:30–10:30 bloque 09:30–11:30 pour le même professeur / salle / groupe',
        'MRV / LCV — domaine minimal puis créneau le moins saturé',
        'Load-cap — plafond pédagogique heures / jour',
    ];

    public static function isCoursMagistral(string $type): bool
    {
        return in_array(strtolower(trim($type)), ['cm', 'cours', 'lecture', 'amphi', 'magistral'], true);
    }

    /**
     * @param  array<string, mixed>  $var
     * @return array<int, int|string>
     */
    public static function occupiedGroupIds(array $var): array
    {
        $ids = $var['occupied_group_ids'] ?? [$var['group_id'] ?? null];

        return array_values(array_filter($ids, fn ($id) => $id !== null && $id !== ''));
    }

    /**
     * @param  array<int, array<string, mixed>>  $variables
     * @return array<string, mixed>
     */
    public function place(array $variables, Collection $rooms, array $config = []): array
    {
        $maxDailyHours = (int) ($config['max_daily_hours'] ?? 8);
        $maxDailySlots = max(1, (int) ceil($maxDailyHours / 2));
        $energyWeight = (int) ($config['energy_weight'] ?? 80);
        $preferOriginal = (bool) ($config['prefer_original_slot'] ?? false);
        $this->workingDays = ($config['include_saturday'] ?? false)
            ? array_keys(SmartSchedulingEngine::DAYS)
            : [1, 2, 3, 4, 5];

        $variables = $this->mergeSharedCours($variables);

        $grid = new TimetableOccupancyGrid;
        $unavailable = $this->prefetchUnavailability();
        $feasibleRooms = $this->indexFeasibleRooms($variables, $rooms);
        $degree = $this->degreeScores($variables);

        $remaining = array_values($variables);
        $assignments = [];
        $unplaced = [];
        $conflictsPrevented = 0;
        $buildingUsage = [];

        $filiereBuildingPref = [
            'GFC' => 'Bâtiment A',
            'MCM' => 'Bâtiment B',
            'TC' => 'Bâtiment Principal',
            'GRH' => 'Bâtiment B',
        ];

        while ($remaining !== []) {
            usort($remaining, function (array $a, array $b) use ($grid, $feasibleRooms, $degree, $maxDailySlots, $unavailable) {
                $domainA = $this->domainSize($a, $grid, $feasibleRooms[$a['var_id']] ?? collect(), $maxDailySlots, $unavailable);
                $domainB = $this->domainSize($b, $grid, $feasibleRooms[$b['var_id']] ?? collect(), $maxDailySlots, $unavailable);
                if ($domainA !== $domainB) {
                    return $domainA <=> $domainB;
                }

                $degA = $degree[$a['var_id']] ?? 0;
                $degB = $degree[$b['var_id']] ?? 0;
                if ($degA !== $degB) {
                    return $degB <=> $degA;
                }

                return strcmp((string) ($a['var_id'] ?? ''), (string) ($b['var_id'] ?? ''));
            });

            $var = array_shift($remaining);
            $prefBuilding = $filiereBuildingPref[$var['filiere_code'] ?? ''] ?? 'Bâtiment A';
            $candidate = $this->bestSlot(
                $var,
                $grid,
                $feasibleRooms[$var['var_id']] ?? collect(),
                $maxDailySlots,
                $unavailable,
                $energyWeight,
                $prefBuilding,
                $preferOriginal
            );

            if ($candidate === null) {
                $unplaced[] = $var;
                $conflictsPrevented++;

                continue;
            }

            $grid->occupy(
                $candidate['day'],
                $candidate['slot'],
                $candidate['block']['start'],
                $candidate['block']['end'],
                $var['professor_id'],
                self::occupiedGroupIds($var),
                $candidate['room']->id
            );

            $building = $candidate['room']->building ?? 'Bâtiment Principal';
            $buildingUsage[$building] = ($buildingUsage[$building] ?? 0) + 1;

            $assignments[] = array_merge($var, [
                'day_of_week' => $candidate['day'],
                'day_name' => SmartSchedulingEngine::DAYS[$candidate['day']] ?? 'Jour',
                'start_time' => $candidate['block']['start'],
                'end_time' => $candidate['block']['end'],
                'slot_label' => $candidate['block']['label'],
                'room_id' => $candidate['room']->id,
                'room_name' => $candidate['room']->name ?? 'Salle',
                'room_building' => $building,
                'occupied_group_ids' => self::occupiedGroupIds($var),
                'energy_score' => ($building === $prefBuilding) ? 98 : 85,
                'strategy_score' => $candidate['score'],
            ]);
        }

        return [
            'success' => count($unplaced) === 0,
            'strategy' => self::NAME,
            'heuristics' => self::HEURISTICS,
            'hard_constraints' => ['professor_interval', 'room_interval', 'group_interval', 'cm_shared', 'td_per_group'],
            'assignments' => $assignments,
            'unplaced' => $unplaced,
            'conflicts_prevented' => $conflictsPrevented,
            'building_clustering' => $buildingUsage,
            'zero_hard_conflicts' => $this->hasZeroHardConflicts($assignments),
            'load_balance' => $this->loadBalanceScore($assignments),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $assignments
     */
    public function hasZeroHardConflicts(array $assignments): bool
    {
        $count = count($assignments);
        for ($i = 0; $i < $count; $i++) {
            for ($j = $i + 1; $j < $count; $j++) {
                if ($this->assignmentsConflict($assignments[$i], $assignments[$j])) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $a
     * @param  array<string, mixed>  $b
     */
    public function assignmentsConflict(array $a, array $b): bool
    {
        if ((int) ($a['day_of_week'] ?? 0) !== (int) ($b['day_of_week'] ?? 0)) {
            return false;
        }

        $startA = TimetableOccupancyGrid::minutes((string) ($a['start_time'] ?? '00:00:00'));
        $endA = TimetableOccupancyGrid::minutes((string) ($a['end_time'] ?? '00:00:00'));
        $startB = TimetableOccupancyGrid::minutes((string) ($b['start_time'] ?? '00:00:00'));
        $endB = TimetableOccupancyGrid::minutes((string) ($b['end_time'] ?? '00:00:00'));
        if (! TimetableOccupancyGrid::intervalsOverlap($startA, $endA, $startB, $endB)) {
            return false;
        }

        if ($this->isSharedCoursPair($a, $b)) {
            return false;
        }

        if ((string) ($a['professor_id'] ?? '') !== '' && (string) ($a['professor_id'] ?? '') === (string) ($b['professor_id'] ?? '')) {
            return true;
        }
        if ((string) ($a['room_id'] ?? '') !== '' && (string) ($a['room_id'] ?? '') === (string) ($b['room_id'] ?? '')) {
            return true;
        }

        $groupsA = array_map('strval', self::occupiedGroupIds($a));
        $groupsB = array_map('strval', self::occupiedGroupIds($b));

        return count(array_intersect($groupsA, $groupsB)) > 0;
    }

    /**
     * Cours magistral : G1 et G2 suivent le même CM (même module, même prof) — ce n'est pas un conflit.
     *
     * @param  array<string, mixed>  $a
     * @param  array<string, mixed>  $b
     */
    public function isSharedCoursPair(array $a, array $b): bool
    {
        $typeA = (string) ($a['session_type'] ?? 'cm');
        $typeB = (string) ($b['session_type'] ?? 'cm');
        if (! self::isCoursMagistral($typeA) || ! self::isCoursMagistral($typeB)) {
            return false;
        }

        return (string) ($a['professor_id'] ?? '') === (string) ($b['professor_id'] ?? '')
            && (string) ($a['module_id'] ?? $a['module_name'] ?? '') === (string) ($b['module_id'] ?? $b['module_name'] ?? '')
            && (string) ($a['professor_id'] ?? '') !== '';
    }

    /**
     * @param  array<int, array<string, mixed>>  $variables
     * @return array<int, Collection>
     */
    private function indexFeasibleRooms(array $variables, Collection $rooms): array
    {
        $index = [];
        foreach ($variables as $var) {
            $index[$var['var_id']] = $rooms->filter(function ($room) use ($var) {
                if (($room->is_out_of_service ?? false) || ($room->status ?? null) === 'out_of_service' || (($room->is_available ?? true) === false)) {
                    return false;
                }
                $capacity = (int) ($room->capacity ?? 40);
                $groupSize = (int) ($var['group_size'] ?? 30);
                if ($capacity < $groupSize) {
                    return false;
                }
                if (($var['session_type'] ?? 'cm') === 'cm' && $groupSize > 60 && ($room->type ?? '') !== 'amphitheater') {
                    return false;
                }
                if (self::isCoursMagistral((string) ($var['session_type'] ?? 'cm')) && count(self::occupiedGroupIds($var)) > 1 && $capacity < 80 && ($room->type ?? '') === 'classroom' && $groupSize > 70) {
                    return false;
                }

                return true;
            })->values();
        }

        return $index;
    }

    /**
     * @param  array<int, array<string, mixed>>  $variables
     * @return array<int|string, int>
     */
    private function degreeScores(array $variables): array
    {
        $profCount = [];
        $groupCount = [];
        foreach ($variables as $var) {
            $profCount[$var['professor_id']] = ($profCount[$var['professor_id']] ?? 0) + 1;
            $groupCount[$var['group_id']] = ($groupCount[$var['group_id']] ?? 0) + 1;
        }

        $degree = [];
        foreach ($variables as $var) {
            $degree[$var['var_id']] = ($profCount[$var['professor_id']] ?? 0) + ($groupCount[$var['group_id']] ?? 0);
        }

        return $degree;
    }

    private function domainSize(
        array $var,
        TimetableOccupancyGrid $grid,
        Collection $rooms,
        int $maxDailySlots,
        array $unavailable
    ): int {
        $groupIds = self::occupiedGroupIds($var);
        $size = 0;
        foreach ($this->workingDays as $day) {
            if ($grid->maxGroupDaySlots($day, $groupIds) >= $maxDailySlots) {
                continue;
            }
            if ($grid->professorDaySlots($day, $var['professor_id']) >= $maxDailySlots) {
                continue;
            }
            foreach (SmartSchedulingEngine::TIME_BLOCKS as $block) {
                if ($grid->professorBusy($day, $block['start'], $block['end'], $var['professor_id'])) {
                    continue;
                }
                if ($grid->groupsBusy($day, $block['start'], $block['end'], $groupIds)) {
                    continue;
                }
                if (! $this->isProfessorAvailable($unavailable, (int) $var['professor_id'], $day, $block['start'], $block['end'])) {
                    continue;
                }
                foreach ($rooms as $room) {
                    if (! $grid->roomBusy($day, $block['start'], $block['end'], $room->id)) {
                        $size++;
                        break;
                    }
                }
            }
        }

        return $size;
    }

    private function bestSlot(
        array $var,
        TimetableOccupancyGrid $grid,
        Collection $rooms,
        int $maxDailySlots,
        array $unavailable,
        int $energyWeight,
        string $prefBuilding,
        bool $preferOriginal
    ): ?array {
        $groupIds = self::occupiedGroupIds($var);
        $best = null;

        foreach ($this->workingDays as $day) {
            if ($grid->maxGroupDaySlots($day, $groupIds) >= $maxDailySlots) {
                continue;
            }
            if ($grid->professorDaySlots($day, $var['professor_id']) >= $maxDailySlots) {
                continue;
            }

            foreach (SmartSchedulingEngine::TIME_BLOCKS as $block) {
                $slot = $block['slot_index'];
                if ($grid->professorBusy($day, $block['start'], $block['end'], $var['professor_id'])) {
                    continue;
                }
                if ($grid->groupsBusy($day, $block['start'], $block['end'], $groupIds)) {
                    continue;
                }
                if (! $this->isProfessorAvailable($unavailable, (int) $var['professor_id'], $day, $block['start'], $block['end'])) {
                    continue;
                }

                foreach ($rooms as $room) {
                    if ($grid->roomBusy($day, $block['start'], $block['end'], $room->id)) {
                        continue;
                    }

                    $capacityWaste = max(0, (int) ($room->capacity ?? 40) - (int) ($var['group_size'] ?? 30));
                    $buildingPenalty = (($room->building ?? '') === $prefBuilding) ? 0 : (100 - $energyWeight);
                    $saturdayPenalty = $day === 6 ? 35 : 0;
                    $stabilityBonus = 0;
                    if ($preferOriginal && (int) ($var['preferred_day'] ?? 0) === $day && ($var['preferred_start'] ?? '') === $block['start']) {
                        $stabilityBonus = -40;
                    }

                    $score = ($grid->maxGroupDaySlots($day, $groupIds) * 45)
                        + ($grid->professorDaySlots($day, $var['professor_id']) * 30)
                        + ($grid->slotOccupancy($day, $slot) * 8)
                        + $capacityWaste
                        + $buildingPenalty
                        + $saturdayPenalty
                        + $stabilityBonus;

                    if ($best === null || $score < $best['score']) {
                        $best = [
                            'day' => $day,
                            'slot' => $slot,
                            'block' => $block,
                            'room' => $room,
                            'score' => $score,
                        ];
                    }
                }
            }
        }

        return $best;
    }

    /**
     * Fusionne les CM du même module/prof (G1 + G2) en une seule séance occupée par les deux groupes.
     *
     * @param  array<int, array<string, mixed>>  $variables
     * @return array<int, array<string, mixed>>
     */
    private function mergeSharedCours(array $variables): array
    {
        $standalone = [];
        $buckets = [];

        foreach ($variables as $var) {
            $type = (string) ($var['session_type'] ?? 'cm');
            if (! self::isCoursMagistral($type)) {
                $standalone[] = $var;

                continue;
            }

            $key = ($var['professor_id'] ?? '').'|'.($var['module_id'] ?? $var['module_name'] ?? '').'|cm';
            $buckets[$key][] = $var;
        }

        foreach ($buckets as $items) {
            if (count($items) === 1) {
                $item = $items[0];
                $item['occupied_group_ids'] = self::occupiedGroupIds($item);
                $standalone[] = $item;

                continue;
            }

            $groupIds = [];
            $scheduleIds = [];
            $size = 0;
            $names = [];
            foreach ($items as $item) {
                foreach (self::occupiedGroupIds($item) as $gid) {
                    $groupIds[] = $gid;
                }
                if (! empty($item['schedule_id'])) {
                    $scheduleIds[] = $item['schedule_id'];
                }
                $size += (int) ($item['group_size'] ?? 30);
                $names[] = $item['group_name'] ?? '';
            }

            $merged = $items[0];
            $merged['occupied_group_ids'] = array_values(array_unique($groupIds));
            $merged['schedule_ids'] = $scheduleIds;
            $merged['group_size'] = $size;
            $merged['group_name'] = implode(' + ', array_filter($names));
            $standalone[] = $merged;
        }

        return $standalone;
    }

    /**
     * @return array<int, array<int, array{start: string, end: string, available: bool}>>
     */
    private function prefetchUnavailability(): array
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('professor_availabilities')) {
            return [];
        }

        $map = [];
        ProfessorAvailability::query()
            ->select(['professor_id', 'day_of_week', 'start_time', 'end_time', 'is_available'])
            ->get()
            ->each(function ($row) use (&$map) {
                $map[(int) $row->professor_id][] = [
                    'day' => (int) $row->day_of_week,
                    'start' => (string) $row->start_time,
                    'end' => (string) $row->end_time,
                    'available' => (bool) $row->is_available,
                ];
            });

        return $map;
    }

    private function isProfessorAvailable(array $unavailable, int $professorId, int $day, string $start, string $end): bool
    {
        $records = $unavailable[$professorId] ?? [];
        if ($records === []) {
            return true;
        }

        $blocked = false;
        $hasPositiveWindow = false;
        $insidePositive = false;

        foreach ($records as $record) {
            if ((int) $record['day'] !== $day) {
                continue;
            }
            $overlaps = $start < $record['end'] && $end > $record['start'];
            if (! $record['available'] && $overlaps) {
                $blocked = true;
            }
            if ($record['available']) {
                $hasPositiveWindow = true;
                if ($start >= $record['start'] && $end <= $record['end']) {
                    $insidePositive = true;
                }
            }
        }

        if ($blocked) {
            return false;
        }

        if ($hasPositiveWindow) {
            return $insidePositive;
        }

        return true;
    }

    /**
     * @param  array<int, array<string, mixed>>  $assignments
     */
    private function loadBalanceScore(array $assignments): float
    {
        $byGroupDay = [];
        foreach ($assignments as $session) {
            $key = ($session['group_id'] ?? '').'|'.($session['day_of_week'] ?? '');
            $byGroupDay[$key] = ($byGroupDay[$key] ?? 0) + 1;
        }
        if ($byGroupDay === []) {
            return 100.0;
        }
        $avg = array_sum($byGroupDay) / count($byGroupDay);
        $variance = 0.0;
        foreach ($byGroupDay as $count) {
            $variance += ($count - $avg) ** 2;
        }
        $stdev = sqrt($variance / count($byGroupDay));

        return round(max(0, 100 - ($stdev * 25)), 1);
    }
}
