<?php

namespace Tests\Feature;

use App\Services\Academic\TimetablePerformanceStrategy;
use Tests\TestCase;

class TimetablePerformanceStrategyTest extends TestCase
{
    public function test_never_double_books_professor_room_or_group(): void
    {
        $rooms = collect([
            (object) ['id' => 1, 'name' => 'Salle TD 101', 'capacity' => 45, 'type' => 'classroom', 'building' => 'Bâtiment A'],
            (object) ['id' => 2, 'name' => 'Salle TD 102', 'capacity' => 45, 'type' => 'classroom', 'building' => 'Bâtiment A'],
            (object) ['id' => 3, 'name' => 'Amphi Ibn Khaldoun', 'capacity' => 180, 'type' => 'amphitheater', 'building' => 'Bâtiment Principal'],
        ]);

        $variables = [];
        $varId = 1;
        foreach ([11, 12] as $groupId) {
            foreach ([21, 22, 23, 24] as $moduleId) {
                $variables[] = [
                    'var_id' => $varId++,
                    'group_id' => $groupId,
                    'group_name' => 'G'.$groupId,
                    'group_size' => 35,
                    'module_id' => $moduleId,
                    'module_name' => 'Module '.$moduleId,
                    'module_code' => 'M'.$moduleId,
                    'filiere_code' => 'TC',
                    'professor_id' => 100 + ($moduleId % 3),
                    'session_type' => 'cm',
                ];
            }
        }

        $result = app(TimetablePerformanceStrategy::class)->place($variables, $rooms, [
            'max_daily_hours' => 8,
            'energy_weight' => 80,
        ]);

        $this->assertTrue($result['zero_hard_conflicts']);
        $this->assertSame(count($variables), count($result['assignments']));
        $this->assertSame('MRV-Degree-LCV', $result['strategy']);
        $this->assertSame(['professor', 'room', 'group'], $result['hard_constraints']);
    }

    public function test_same_professor_cannot_teach_two_groups_at_once(): void
    {
        $rooms = collect([
            (object) ['id' => 1, 'name' => 'Salle 1', 'capacity' => 40, 'type' => 'classroom', 'building' => 'A'],
            (object) ['id' => 2, 'name' => 'Salle 2', 'capacity' => 40, 'type' => 'classroom', 'building' => 'A'],
        ]);

        $variables = [
            [
                'var_id' => 1,
                'group_id' => 1,
                'group_size' => 30,
                'filiere_code' => 'GFC',
                'professor_id' => 9,
                'session_type' => 'cm',
                'module_name' => 'Finance I',
            ],
            [
                'var_id' => 2,
                'group_id' => 2,
                'group_size' => 30,
                'filiere_code' => 'GFC',
                'professor_id' => 9,
                'session_type' => 'cm',
                'module_name' => 'Finance I',
            ],
        ];

        $result = app(TimetablePerformanceStrategy::class)->place($variables, $rooms);

        $slots = collect($result['assignments'])->map(fn ($s) => $s['day_of_week'].'|'.$s['start_time'])->all();
        $this->assertCount(2, array_unique($slots));
        $this->assertTrue($result['zero_hard_conflicts']);
    }
}
