<?php

namespace Tests\Feature;

use App\Models\Campus;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\Schedule;
use App\Models\User;
use App\Services\Academic\RoomAvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class RoomAvailabilityAndSmartFinderTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Room $amphi;
    private Room $salleTd;

    protected function setUp(): void
    {
        parent::setUp();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        $adminRole = Role::firstOrCreate(['name' => 'institution-admin', 'guard_name' => 'sanctum']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole($adminRole);

        $this->amphi = Room::create([
            'institution_id' => 1,
            'name' => 'Amphi Test A',
            'code' => 'AMPHI-TEST-A',
            'type' => 'amphitheatre',
            'capacity' => 150,
            'exam_capacity' => 75,
            'has_projector' => true,
            'has_ac' => true,
            'is_available' => true,
        ]);

        $this->salleTd = Room::create([
            'institution_id' => 1,
            'name' => 'Salle TD Test 101',
            'code' => 'TD-TEST-101',
            'type' => 'classroom',
            'capacity' => 40,
            'exam_capacity' => 20,
            'has_projector' => true,
            'has_ac' => false,
            'is_available' => true,
        ]);
    }

    public function test_smart_find_detects_free_room()
    {
        $service = app(RoomAvailabilityService::class);

        $result = $service->smartFind([
            'date' => now()->addDay()->format('Y-m-d'),
            'start_time' => '08:30',
            'end_time' => '10:30',
            'preferred_room_id' => $this->amphi->id,
            'session_type' => 'cm',
            'headcount' => 80,
        ]);

        $this->assertTrue($result['success']);
        $this->assertNotNull($result['preferred_room']);
        $this->assertTrue($result['preferred_room']['is_available']);
        $this->assertNull($result['preferred_room']['conflict_reason']);
        $this->assertGreaterThanOrEqual(1, $result['available_rooms_count']);
    }

    public function test_smart_find_detects_occupied_room_and_suggests_alternatives()
    {
        $testDate = Carbon::now()->next(Carbon::TUESDAY);
        $dayOfWeek = (int) $testDate->dayOfWeekIso;

        $year = $this->ensureAcademicYear();
        $semester = $year->semesters()->firstOrCreate([
            'name' => 'Semestre 1',
            'number' => 1,
            'start_date' => '2026-09-01',
            'end_date' => '2027-01-31',
        ]);
        $profUser = User::factory()->create(['first_name' => 'Karim', 'last_name' => 'Benali']);
        $prof = $this->makeTestProfessor(['user' => $profUser]);
        $filiere = $this->makeTestFiliere(['name' => 'Tronc Commun Test']);
        $group = Group::create([
            'academic_year_id' => $year->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 1,
            'name' => 'G1',
            'capacity' => 40,
        ]);
        $module = $this->makeTestModule($filiere->id, [
            'name' => 'Finance Approfondie',
        ]);

        Schedule::create([
            'institution_id' => 1,
            'academic_year_id' => $year->id,
            'semester_id' => $semester->id,
            'group_id' => $group->id,
            'module_id' => $module->id,
            'room_id' => $this->amphi->id,
            'professor_id' => $prof->id,
            'professor_type' => 'App\Models\Professor',
            'day_of_week' => $dayOfWeek,
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
            'session_type' => 'cm',
            'is_active' => true,
        ]);

        $service = app(RoomAvailabilityService::class);

        $result = $service->smartFind([
            'date' => $testDate->format('Y-m-d'),
            'start_time' => '08:30',
            'end_time' => '10:30',
            'preferred_room_id' => $this->amphi->id,
            'session_type' => 'cm',
            'headcount' => 80,
        ]);

        $this->assertTrue($result['success']);
        $this->assertNotNull($result['preferred_room']);
        $this->assertFalse($result['preferred_room']['is_available']);
        $this->assertNotNull($result['preferred_room']['conflict_reason']);
        $this->assertStringContainsString('Finance Approfondie', $result['preferred_room']['conflict_reason']);
        $this->assertStringContainsString('Benali', $result['preferred_room']['conflict_reason']);

        // Should have alternative time slots for this room
        $this->assertNotEmpty($result['alternative_slots']);
    }

    public function test_occupancy_matrix_endpoint_returns_valid_structure()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rooms/occupancy-matrix?date='.now()->format('Y-m-d'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'date',
                    'day_name',
                    'time_blocks',
                    'rooms' => [
                        '*' => [
                            'room_id',
                            'name',
                            'type',
                            'capacity',
                            'slots' => [
                                '*' => ['slot_index', 'time_label', 'status', 'title']
                            ],
                            'occupancy_rate',
                        ]
                    ],
                    'stats' => [
                        'total_rooms',
                        'total_slots',
                        'occupied_slots',
                        'free_slots',
                        'global_occupancy_rate',
                    ]
                ]
            ]);
    }

    public function test_smart_find_api_endpoint()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/rooms/smart-find', [
                'date' => now()->addDay()->format('Y-m-d'),
                'start_time' => '10:45',
                'end_time' => '12:45',
                'session_type' => 'td',
                'headcount' => 35,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'query',
                'available_rooms',
                'available_rooms_count',
            ]);
    }

    public function test_weekly_master_matrix_api_endpoint()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rooms/weekly-master-matrix');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'start_of_week',
                    'week_label',
                    'days',
                    'time_blocks',
                    'rooms' => [
                        '*' => [
                            'room_id',
                            'name',
                            'code',
                            'type',
                            'capacity',
                            'slots' => [
                                '*' => [
                                    'slot_index',
                                    'time_label',
                                    'days',
                                ]
                            ]
                        ]
                    ],
                    'stats' => [
                        'total_rooms',
                        'total_cells',
                        'occupied_cells',
                        'free_cells',
                        'occupancy_rate',
                    ]
                ]
            ]);
    }
}
