<?php

namespace Tests\Feature;

use App\Models\Campus;
use App\Models\Group;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Services\Academic\OfficialTimetableMatrixService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OfficialTimetableMatrixTest extends TestCase
{
    use RefreshDatabase;

    public function test_matrix_uses_official_group_and_french_hours(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $this->makeTestSemester($year->id, ['is_current' => true, 'number' => 1]);
        $filiere = $this->makeTestFiliere(['code' => 'TC']);
        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );
        $room = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'AMPHI 2',
            'code' => 'A2-'.uniqid(),
            'type' => 'amphitheater',
            'capacity' => 200,
        ]);
        $module = $this->makeTestModule($filiere->id, ['name' => 'Management']);
        $prof = $this->makeTestProfessor();
        $group = Group::create([
            'academic_year_id' => $year->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 1,
            'name' => 'Groupe 1 (S1)',
            'capacity' => 40,
        ]);
        $semester = $year->semesters()->first();

        $session = Schedule::create([
            'institution_id' => 1,
            'academic_year_id' => $year->id,
            'semester_id' => $semester->id,
            'group_id' => $group->id,
            'module_id' => $module->id,
            'room_id' => $room->id,
            'professor_id' => $prof->id,
            'professor_type' => Professor::class,
            'day_of_week' => 1,
            'start_time' => '14:30:00',
            'end_time' => '16:30:00',
            'session_type' => 'td',
            'is_active' => true,
        ]);
        $session->load(['module', 'professor.user', 'room', 'group.filiere']);

        $matrix = app(OfficialTimetableMatrixService::class)->fromSchedules(collect([$session]), [
            'filiere' => $filiere,
            'semester' => $semester,
            'academic_year' => $year,
        ]);

        $this->assertSame('EMPLOI DU TEMPS S1', $matrix['title']);
        $this->assertSame('S1 AP', $matrix['semester_label']);
        $this->assertSame('G1: 14h30-16h30', $matrix['rows'][0]['days'][1][0]);
        $this->assertSame('Management', $matrix['rows'][0]['module_name']);
        $this->assertSame('TD Management', $matrix['rows'][0]['element_name']);
        $this->assertNotSame($matrix['rows'][0]['module_name'], $matrix['rows'][0]['element_name']);
        $this->assertStringContainsString('(TD)', $matrix['rows'][0]['professor_name']);
        $this->assertSame('AMPHI 2', $matrix['rows'][0]['room_label']);
    }

    public function test_specialty_semester_is_not_forced_to_ap(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $this->makeTestSemester($year->id, ['is_current' => true, 'number' => 1]);
        $gfc = $this->makeTestFiliere(['code' => 'GFC', 'name' => 'Gestion Financière et Comptable']);
        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );
        $room = Room::create([
            'institution_id' => 1, 'campus_id' => $campus->id, 'name' => 'AMPHI 1', 'code' => 'A1-'.uniqid(), 'type' => 'amphitheater', 'capacity' => 180,
        ]);
        $group = Group::create([
            'academic_year_id' => $year->id, 'filiere_id' => $gfc->id, 'semester_number' => 5, 'name' => 'GFC-S5-G1', 'capacity' => 40,
        ]);
        $semester = $year->semesters()->first();
        $session = Schedule::create([
            'institution_id' => 1,
            'academic_year_id' => $year->id,
            'semester_id' => $semester->id,
            'group_id' => $group->id,
            'module_id' => $this->makeTestModule($gfc->id, ['name' => 'Finance', 'semester_number' => 5])->id,
            'room_id' => $room->id,
            'professor_id' => $this->makeTestProfessor()->id,
            'professor_type' => Professor::class,
            'day_of_week' => 3,
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
            'session_type' => 'cm',
            'is_active' => true,
        ]);
        $session->load(['module', 'professor.user', 'room', 'group.filiere']);

        $catalog = app(OfficialTimetableMatrixService::class)->catalog(collect([$session]), ['academic_year' => $year]);
        $this->assertCount(1, $catalog['sections']);
        $this->assertSame('EMPLOI DU TEMPS S5', $catalog['sections'][0]['title']);
        $this->assertSame('S5 GFC', $catalog['sections'][0]['semester_label']);
        $this->assertSame('Finance', $catalog['sections'][0]['rows'][0]['module_name']);
        $this->assertSame('CM Finance', $catalog['sections'][0]['rows'][0]['element_name']);
        $this->assertSame('G1: 08h30-10h30', $catalog['sections'][0]['rows'][0]['days'][3][0]);
    }
}
