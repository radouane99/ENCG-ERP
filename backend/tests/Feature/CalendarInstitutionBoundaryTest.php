<?php

namespace Tests\Feature;

use App\Models\Campus;
use App\Models\Group;
use App\Models\Institution;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\ScheduleChange;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CalendarInstitutionBoundaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_calendar_moves_are_scoped_to_the_actors_institution(): void
    {
        config(['erp.institution_id' => 1]);
        $other = Institution::create(['name' => 'Other test campus', 'code' => 'OTHER', 'slug' => 'other']);
        $admin = User::factory()->create(['institution_id' => 1]);
        $admin->assignRole(Role::findOrCreate('institution-admin', 'sanctum'));
        Sanctum::actingAs($admin);

        $year = $this->makeTestAcademicYear();
        $semester = $this->makeTestSemester($year->id);
        $filiere = $this->makeTestFiliere();
        $group = Group::create(['filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'semester_number' => 1, 'name' => 'G1', 'capacity' => 30]);
        $module = $this->makeTestModule($filiere->id);
        $campus = Campus::create(['institution_id' => 1, 'name' => 'Test Campus', 'code' => 'CAL-TEST']);
        $room = Room::create(['institution_id' => 1, 'campus_id' => $campus->id, 'name' => 'Test Room', 'code' => 'CAL-R', 'type' => 'classroom', 'capacity' => 30]);
        $schedule = Schedule::create([
            'institution_id' => $other->id,
            'academic_year_id' => $year->id,
            'semester_id' => $semester->id,
            'group_id' => $group->id,
            'module_id' => $module->id,
            'room_id' => $room->id,
            'professor_id' => $admin->id,
            'professor_type' => User::class,
            'session_type' => 'td',
            'day_of_week' => 1,
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
        ]);
        $change = ScheduleChange::create([
            'schedule_id' => $schedule->id,
            'original_date' => '2026-11-02',
            'type' => 'rescheduled',
            'created_by' => $admin->id,
        ]);
        $payload = [
            'old_date' => '2026-11-02', 'new_date' => '2026-11-03',
            'new_start_time' => '09:00:00', 'new_end_time' => '11:00:00',
        ];

        $this->patchJson('/api/timetable/events/move', $payload + [
            'event_id' => "schedule_{$schedule->id}_2026-11-02",
        ])->assertNotFound();
        $this->patchJson('/api/timetable/events/move', $payload + [
            'event_id' => "makeup_{$change->id}",
        ])->assertNotFound();
        $this->assertNull($change->refresh()->new_date);

        $schedule->update(['institution_id' => 1]);
        $this->patchJson('/api/timetable/events/move', $payload + [
            'event_id' => "makeup_{$change->id}",
        ])->assertOk();
        $this->assertDatabaseHas('schedule_changes', ['id' => $change->id, 'new_date' => '2026-11-03']);
    }
}
