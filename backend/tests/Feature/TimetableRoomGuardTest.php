<?php

namespace Tests\Feature;

use App\Models\Campus;
use App\Models\Group;
use App\Models\Professor;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\Schedule;
use App\Models\User;
use App\Services\Academic\TimetablePerformanceStrategy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimetableRoomGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_booking_hides_room_on_same_weekday_slot(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $this->makeTestSemester($year->id, ['is_current' => true, 'number' => 1]);
        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );
        $booked = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'Salle 25',
            'code' => 'S25-'.uniqid(),
            'type' => 'classroom',
            'capacity' => 40,
        ]);
        $free = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'Salle 26',
            'code' => 'S26-'.uniqid(),
            'type' => 'classroom',
            'capacity' => 40,
        ]);

        RoomBooking::create([
            'room_id' => $booked->id,
            'room_name' => $booked->name,
            'booked_by' => User::factory()->create()->id,
            'purpose' => 'Réunion pédagogique',
            'start_time' => '2026-08-24 08:30:00',
            'end_time' => '2026-08-24 10:30:00',
            'status' => 'approved',
        ]);

        $result = app(TimetablePerformanceStrategy::class)->place([[
            'var_id' => 1,
            'group_id' => 1,
            'occupied_group_ids' => [1],
            'group_size' => 30,
            'filiere_code' => 'TC',
            'professor_id' => 4,
            'session_type' => 'td',
            'module_id' => 1,
        ]], collect([$booked, $free]));

        $this->assertNotEmpty($result['assignments']);
        $this->assertSame($free->id, $result['assignments'][0]['room_id']);
        $this->assertSame(1, (int) $result['assignments'][0]['day_of_week']);
        $this->assertSame('08:30:00', $result['assignments'][0]['start_time']);
    }

    public function test_existing_schedule_occupies_room_for_other_filiere(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $semester = $this->makeTestSemester($year->id, ['is_current' => true, 'number' => 1]);
        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );
        $room = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'Salle Unique',
            'code' => 'SU-'.uniqid(),
            'type' => 'classroom',
            'capacity' => 40,
        ]);
        $filiere = $this->makeTestFiliere(['code' => 'TC']);
        $group = Group::create([
            'academic_year_id' => $year->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 1,
            'name' => 'G1',
            'capacity' => 35,
        ]);
        Schedule::create([
            'institution_id' => 1,
            'academic_year_id' => $year->id,
            'semester_id' => $semester->id,
            'group_id' => $group->id,
            'module_id' => $this->makeTestModule($filiere->id)->id,
            'room_id' => $room->id,
            'professor_id' => $this->makeTestProfessor()->id,
            'professor_type' => Professor::class,
            'day_of_week' => 1,
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
            'session_type' => 'td',
            'is_active' => true,
        ]);

        $result = app(TimetablePerformanceStrategy::class)->place([[
            'var_id' => 99,
            'group_id' => 2,
            'occupied_group_ids' => [2],
            'group_size' => 30,
            'filiere_code' => 'GFC',
            'professor_id' => 88,
            'session_type' => 'td',
            'module_id' => 2,
        ]], collect([$room]));

        $this->assertNotSame('08:30:00', $result['assignments'][0]['start_time'] ?? null);
        $this->assertTrue($result['success']);
    }

    public function test_available_rooms_excludes_booked_and_scheduled_rooms(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $semester = $this->makeTestSemester($year->id, ['is_current' => true, 'number' => 1]);
        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );
        $booked = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'Salle Extra 1',
            'code' => 'EX1-'.uniqid(),
            'type' => 'classroom',
            'capacity' => 40,
        ]);
        $scheduled = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'Salle Extra 2',
            'code' => 'EX2-'.uniqid(),
            'type' => 'classroom',
            'capacity' => 40,
        ]);
        $free = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'Salle Extra 3',
            'code' => 'EX3-'.uniqid(),
            'type' => 'classroom',
            'capacity' => 40,
        ]);

        RoomBooking::create([
            'room_id' => $booked->id,
            'room_name' => $booked->name,
            'booked_by' => User::factory()->create()->id,
            'purpose' => 'Séance extra',
            'start_time' => '2026-08-24 08:30:00',
            'end_time' => '2026-08-24 10:30:00',
            'status' => 'approved',
        ]);

        $filiere = $this->makeTestFiliere(['code' => 'TC']);
        $group = Group::create([
            'academic_year_id' => $year->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 1,
            'name' => 'G-AV',
            'capacity' => 35,
        ]);
        Schedule::create([
            'institution_id' => 1,
            'academic_year_id' => $year->id,
            'semester_id' => $semester->id,
            'group_id' => $group->id,
            'module_id' => $this->makeTestModule($filiere->id)->id,
            'room_id' => $scheduled->id,
            'professor_id' => $this->makeTestProfessor()->id,
            'professor_type' => Professor::class,
            'day_of_week' => 1,
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
            'session_type' => 'td',
            'is_active' => true,
        ]);

        $data = app(\App\Services\Academic\TimetableRoomGuard::class)->availableRooms(
            new \DateTimeImmutable('2026-08-24 08:30:00'),
            new \DateTimeImmutable('2026-08-24 10:30:00'),
            30
        );

        $ids = collect($data['available'])->pluck('id')->all();
        $this->assertContains($free->id, $ids);
        $this->assertNotContains($booked->id, $ids);
        $this->assertNotContains($scheduled->id, $ids);
    }
}
