<?php

namespace Tests\Feature;

use App\Models\Campus;
use App\Models\Exam;
use App\Models\ExamIncident;
use App\Models\ExamSession;
use App\Models\Group;
use App\Models\Module;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExamPlanningAndIncidentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private ExamSession $session;

    private Module $module;

    private Room $room;

    private Group $group;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();

        $academicYear = $this->makeTestAcademicYear();
        $filiere = $this->makeTestFiliere(['name' => 'Finance', 'code' => 'FIN']);
        $semester = $this->makeTestSemester($academicYear->id, [
            'name' => 'Semestre 5',
            'number' => 5,
        ]);

        $this->session = ExamSession::create([
            'institution_id' => 1,
            'academic_year_id' => $academicYear->id,
            'semester_id' => $semester->id,
            'name' => 'Session Normale Automne',
            'type' => 'normale',
            'start_date' => '2027-01-10',
            'end_date' => '2027-01-25',
        ]);

        $this->module = $this->makeTestModule($filiere->id, [
            'name' => 'Marchés des Capitaux',
            'code' => 'M502',
            'semester_number' => 5,
        ]);

        $campus = Campus::firstOrCreate(
            ['code' => 'CAMPUS_PRINCIPAL'],
            ['institution_id' => 1, 'name' => 'Campus Principal', 'is_main' => true]
        );

        $this->room = Room::create([
            'institution_id' => 1,
            'campus_id' => $campus->id,
            'name' => 'Amphithéâtre Fatima Al-Fihriya',
            'code' => 'AMPHI-A',
            'type' => 'amphitheater',
            'capacity' => 250,
        ]);

        $this->group = Group::create([
            'academic_year_id' => $academicYear->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 5,
            'name' => 'Groupe 1 (S5)',
            'capacity' => 60,
        ]);
    }

    /**
     * Test de planification d'un examen avec assignation de salle et groupe.
     */
    public function test_can_plan_exam_session_with_room_and_time(): void
    {
        $exam = Exam::create([
            'exam_session_id' => $this->session->id,
            'module_id' => $this->module->id,
            'room_id' => $this->room->id,
            'group_id' => $this->group->id,
            'exam_date' => '2027-01-15',
            'start_time' => '09:00:00',
            'duration_minutes' => 120,
            'type' => 'written',
        ]);

        $this->assertDatabaseHas('exams', [
            'module_id' => $this->module->id,
            'room_id' => $this->room->id,
            'type' => 'written',
        ]);
    }

    /**
     * Test de consignation d'un incident de fraude en salle d'examen.
     */
    public function test_can_record_exam_fraud_incident(): void
    {
        $exam = Exam::create([
            'exam_session_id' => $this->session->id,
            'module_id' => $this->module->id,
            'room_id' => $this->room->id,
            'group_id' => $this->group->id,
            'exam_date' => '2027-01-15',
            'start_time' => '09:00:00',
            'duration_minutes' => 120,
            'type' => 'written',
        ]);

        $student = $this->makeTestStudent([
            'first_name' => 'Othmane',
            'last_name' => 'BENSAID',
            'cne' => 'N991122334',
        ]);

        $incident = ExamIncident::create([
            'exam_id' => $exam->id,
            'student_id' => $student->id,
            'type' => 'fraude',
            'description' => 'Tentative d\'utilisation d\'un smartphone dissimulé',
        ]);

        $this->assertDatabaseHas('exam_incidents', [
            'exam_id' => $exam->id,
            'student_id' => $student->id,
            'type' => 'fraude',
        ]);
    }
}
