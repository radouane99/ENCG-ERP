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

    public const HEURISTICS = [
        'MRV — séances au plus petit domaine d\'abord',
        'Degree — professeurs / groupes les plus partagés d\'abord',
        'LCV — créneau et salle les moins saturés',
        'Smallest-fit — salle la plus proche de l\'effectif',
        'Load-cap — plafond pédagogique heures / jour',
    ];

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
                $var['professor_id'],
                $var['group_id'],
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
                'energy_score' => ($building === $prefBuilding) ? 98 : 85,
                'strategy_score' => $candidate['score'],
            ]);
        }

        return [
            'success' => count($unplaced) === 0,
            'strategy' => self::NAME,
            'heuristics' => self::HEURISTICS,
            'hard_constraints' => ['professor', 'room', 'group'],
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
        $seen = [];
        foreach ($assignments as $session) {
            $slot = ($session['day_of_week'] ?? '').'|'.($session['start_time'] ?? '');
            foreach (['professor_id', 'group_id', 'room_id'] as $resource) {
                $key = $slot.'|'.$resource.'|'.($session[$resource] ?? '');
                if ($key === $slot.'|'.$resource.'|') {
                    continue;
                }
                if (isset($seen[$key])) {
                    return false;
                }
                $seen[$key] = true;
            }
        }

        return true;
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
                if (($room->is_out_of_service ?? false) || ($room->status ?? null) === 'out_of_service' || ($room->is_available === false)) {
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
        $size = 0;
        foreach (array_keys(SmartSchedulingEngine::DAYS) as $day) {
            if ($grid->groupDaySlots($day, $var['group_id']) >= $maxDailySlots) {
                continue;
            }
            if ($grid->professorDaySlots($day, $var['professor_id']) >= $maxDailySlots) {
                continue;
            }
            foreach (SmartSchedulingEngine::TIME_BLOCKS as $block) {
                $slot = $block['slot_index'];
                if ($grid->professorBusy($day, $slot, $var['professor_id']) || $grid->groupBusy($day, $slot, $var['group_id'])) {
                    continue;
                }
                if (! $this->isProfessorAvailable($unavailable, (int) $var['professor_id'], $day, $block['start'], $block['end'])) {
                    continue;
                }
                foreach ($rooms as $room) {
                    if (! $grid->roomBusy($day, $slot, $room->id)) {
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
        $best = null;

        foreach (array_keys(SmartSchedulingEngine::DAYS) as $day) {
            if ($grid->groupDaySlots($day, $var['group_id']) >= $maxDailySlots) {
                continue;
            }
            if ($grid->professorDaySlots($day, $var['professor_id']) >= $maxDailySlots) {
                continue;
            }

            foreach (SmartSchedulingEngine::TIME_BLOCKS as $block) {
                $slot = $block['slot_index'];
                if ($grid->professorBusy($day, $slot, $var['professor_id']) || $grid->groupBusy($day, $slot, $var['group_id'])) {
                    continue;
                }
                if (! $this->isProfessorAvailable($unavailable, (int) $var['professor_id'], $day, $block['start'], $block['end'])) {
                    continue;
                }

                foreach ($rooms as $room) {
                    if ($grid->roomBusy($day, $slot, $room->id)) {
                        continue;
                    }

                    $capacityWaste = max(0, (int) ($room->capacity ?? 40) - (int) ($var['group_size'] ?? 30));
                    $buildingPenalty = (($room->building ?? '') === $prefBuilding) ? 0 : (100 - $energyWeight);
                    $saturdayPenalty = $day === 6 ? 35 : 0;
                    $stabilityBonus = 0;
                    if ($preferOriginal && (int) ($var['preferred_day'] ?? 0) === $day && ($var['preferred_start'] ?? '') === $block['start']) {
                        $stabilityBonus = -40;
                    }

                    $score = ($grid->groupDaySlots($day, $var['group_id']) * 45)
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
