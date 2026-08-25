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
                    'session_type' => 'td',
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
        $this->assertContains('cm_shared', $result['hard_constraints']);
    }

    public function test_weekdays_only_never_assigns_saturday(): void
    {
        $rooms = collect([
            (object) ['id' => 1, 'name' => 'Salle 1', 'capacity' => 40, 'type' => 'classroom', 'building' => 'A'],
        ]);
        $variables = [];
        for ($i = 1; $i <= 6; $i++) {
            $variables[] = [
                'var_id' => $i,
                'group_id' => 1,
                'group_size' => 30,
                'filiere_code' => 'TC',
                'professor_id' => 1,
                'session_type' => 'td',
                'module_id' => $i,
            ];
        }

        $result = app(TimetablePerformanceStrategy::class)->place($variables, $rooms, [
            'include_saturday' => false,
            'max_daily_hours' => 10,
        ]);

        foreach ($result['assignments'] as $session) {
            $this->assertNotSame(6, (int) $session['day_of_week']);
        }
    }

    public function test_cours_magistral_places_both_groups_together(): void
    {
        $rooms = collect([
            (object) ['id' => 1, 'name' => 'Amphi 1', 'capacity' => 120, 'type' => 'amphitheater', 'building' => 'A'],
            (object) ['id' => 2, 'name' => 'Salle 2', 'capacity' => 40, 'type' => 'classroom', 'building' => 'A'],
        ]);

        $variables = [
            [
                'var_id' => 1,
                'group_id' => 1,
                'group_size' => 35,
                'filiere_code' => 'TC',
                'professor_id' => 9,
                'session_type' => 'cm',
                'module_id' => 50,
                'module_name' => 'Statistique',
            ],
            [
                'var_id' => 2,
                'group_id' => 2,
                'group_size' => 35,
                'filiere_code' => 'TC',
                'professor_id' => 9,
                'session_type' => 'cm',
                'module_id' => 50,
                'module_name' => 'Statistique',
            ],
        ];

        $result = app(TimetablePerformanceStrategy::class)->place($variables, $rooms);

        $this->assertCount(1, $result['assignments']);
        $this->assertEqualsCanonicalizing([1, 2], $result['assignments'][0]['occupied_group_ids']);
        $this->assertTrue($result['zero_hard_conflicts']);
    }

    public function test_same_professor_cannot_have_overlapping_intervals(): void
    {
        $strategy = app(TimetablePerformanceStrategy::class);

        $this->assertTrue($strategy->assignmentsConflict(
            [
                'day_of_week' => 1,
                'start_time' => '08:30:00',
                'end_time' => '10:30:00',
                'professor_id' => 9,
                'group_id' => 1,
                'room_id' => 1,
                'session_type' => 'td',
                'module_id' => 1,
            ],
            [
                'day_of_week' => 1,
                'start_time' => '09:30:00',
                'end_time' => '11:30:00',
                'professor_id' => 9,
                'group_id' => 2,
                'room_id' => 2,
                'session_type' => 'td',
                'module_id' => 2,
            ]
        ));
    }

    public function test_parallel_td_for_two_groups_is_allowed(): void
    {
        $strategy = app(TimetablePerformanceStrategy::class);

        $this->assertFalse($strategy->assignmentsConflict(
            [
                'day_of_week' => 1,
                'start_time' => '08:30:00',
                'end_time' => '10:30:00',
                'professor_id' => 9,
                'group_id' => 1,
                'room_id' => 1,
                'session_type' => 'td',
                'module_id' => 1,
            ],
            [
                'day_of_week' => 1,
                'start_time' => '08:30:00',
                'end_time' => '10:30:00',
                'professor_id' => 10,
                'group_id' => 2,
                'room_id' => 2,
                'session_type' => 'td',
                'module_id' => 1,
            ]
        ));
    }
}
