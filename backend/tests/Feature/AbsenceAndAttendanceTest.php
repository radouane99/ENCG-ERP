<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Semester;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AbsenceAndAttendanceTest extends TestCase
{
    use RefreshDatabase;

    private User $studentUser;
    private Student $student;
    private Module $module;
    private Group $group;
    private AcademicYear $academicYear;
    private AttendanceSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->academicYear = $this->makeTestAcademicYear();
        $filiere = $this->makeTestFiliere(['name' => 'Marketing', 'code' => 'MKT']);
        $semester = $this->makeTestSemester($this->academicYear->id, [
            'name'   => 'Semestre 1',
            'number' => 1,
        ]);

        $this->module = $this->makeTestModule($filiere->id, [
            'name'            => 'Marketing Fondamental',
            'code'            => 'M104',
            'semester_number' => 1,
        ]);

        $this->group = Group::create([
            'academic_year_id' => $this->academicYear->id,
            'filiere_id'       => $filiere->id,
            'semester_number'  => 1,
            'name'             => 'Groupe 1 (S1)',
            'capacity'         => 60,
        ]);

        $this->student = $this->makeTestStudent([
            'first_name' => 'Fatima',
            'last_name'  => 'ZAHRA',
            'cne'        => 'N134567890',
        ]);
        $this->studentUser = $this->student->user;

        $professor = Professor::factory()->create();

        $this->session = AttendanceSession::create([
            'module_id'        => $this->module->id,
            'group_id'         => $this->group->id,
            'academic_year_id' => $this->academicYear->id,
            'professor_id'     => $professor->id,
            'professor_type'   => Professor::class,
            'session_date'     => now()->toDateString(),
            'start_time'       => '08:30:00',
            'end_time'         => '10:30:00',
            'session_type'     => 'cm',
            'created_by'       => $this->studentUser->id,
            'module_name'      => 'Marketing Fondamental',
            'group_name'       => 'Groupe 1 (S1)',
            'status'           => 'active',
        ]);
    }

    /**
     * Test d'enregistrement d'une présence et d'une absence.
     */
    public function test_can_record_attendance_and_absence(): void
    {
        $attendance = Attendance::create([
            'attendance_session_id' => $this->session->id,
            'student_id'            => $this->student->id,
            'status'                => 'absent',
            'is_justified'          => false,
        ]);

        $this->assertDatabaseHas('attendances', [
            'attendance_session_id' => $this->session->id,
            'student_id'            => $this->student->id,
            'status'                => 'absent',
            'is_justified'          => false,
        ]);
    }

    /**
     * Test de soumission et validation d'un justificatif médical d'absence.
     */
    public function test_can_justify_absence(): void
    {
        $attendance = Attendance::create([
            'attendance_session_id' => $this->session->id,
            'student_id'            => $this->student->id,
            'status'                => 'absent',
            'is_justified'          => false,
        ]);

        // Justification acceptée
        $attendance->update([
            'is_justified' => true,
            'notes'        => 'Certificat médical CHU Fès',
        ]);

        $this->assertDatabaseHas('attendances', [
            'id'           => $attendance->id,
            'is_justified' => true,
            'notes'        => 'Certificat médical CHU Fès',
        ]);
    }
}
