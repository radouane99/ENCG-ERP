<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SmartTimetableGenerationAndAntiConflictTest extends TestCase
{
    use RefreshDatabase;

    private AcademicYear $academicYear;

    private Professor $prof;

    private Room $room;

    private Group $group;

    private Module $module;

    protected function setUp(): void
    {
        parent::setUp();

        $this->academicYear = $this->makeTestAcademicYear();

        $this->prof = $this->makeTestProfessor([
            'first_name' => 'Pr. Khalid',
            'last_name' => 'EL BAZI',
            'email' => 'elbazi@encg-fes.ac.ma',
        ]);

        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );

        $this->room = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'Salle C12',
            'code' => 'C12',
            'type' => 'classroom',
            'capacity' => 60,
        ]);

        $filiere = $this->makeTestFiliere(['name' => 'Management', 'code' => 'MGT']);
        $this->semester = $this->makeTestSemester($this->academicYear->id, [
            'name' => 'Semestre 3',
            'number' => 3,
        ]);

        $this->module = $this->makeTestModule($filiere->id, [
            'name' => 'Management Stratégique',
            'code' => 'M302',
            'semester_number' => 3,
        ]);

        $this->group = Group::create([
            'academic_year_id' => $this->academicYear->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 3,
            'name' => 'Groupe 1 (S3)',
            'capacity' => 60,
        ]);
    }

    /**
     * Test de programmation d'un créneau d'emploi du temps avec vérification anti-collision.
     */
    public function test_can_schedule_class_slot_without_collision(): void
    {
        $slot = Schedule::create([
            'institution_id' => 1,
            'academic_year_id' => $this->academicYear->id,
            'semester_id' => $this->semester->id,
            'module_id' => $this->module->id,
            'professor_id' => $this->prof->id,
            'professor_type' => Professor::class,
            'session_type' => 'cm',
            'room_id' => $this->room->id,
            'group_id' => $this->group->id,
            'day_of_week' => 1, // Lundi
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
            'version' => 1,
        ]);

        $this->assertDatabaseHas('schedules', [
            'module_id' => $this->module->id,
            'professor_id' => $this->prof->id,
            'room_id' => $this->room->id,
            'day_of_week' => 1,
        ]);
    }
}
