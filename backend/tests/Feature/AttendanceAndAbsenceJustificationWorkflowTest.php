<?php

namespace Tests\Feature;

use App\Models\AbsenceJustification;
use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Department;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttendanceAndAbsenceJustificationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;

    protected AcademicYear $academicYear;

    protected Filiere $filiere;

    protected Module $module;

    protected Group $group;

    protected Professor $professor;

    protected Student $student;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-attendance']
        );

        $this->academicYear = $this->ensureAcademicYear([
            'institution_id' => $this->institution->id,
        ]);

        $department = Department::firstOrCreate(
            ['code' => 'MANAGEMENT'],
            ['name' => 'Management', 'institution_id' => $this->institution->id]
        );

        $this->filiere = Filiere::firstOrCreate(
            ['code' => 'GRH'],
            [
                'name' => 'Management des Ressources Humaines',
                'type' => 'grande_ecole',
                'duration_years' => 5,
                'department_id' => $department->id,
                'institution_id' => $this->institution->id,
                'is_active' => true,
            ]
        );

        $this->module = Module::firstOrCreate(
            ['code' => 'GRH201', 'filiere_id' => $this->filiere->id],
            [
                'name' => 'Gestion Prévisionnelle des Emplois',
                'semester_number' => 5,
                'coefficient' => 1.00,
                'credit_hours' => 45,
                'institution_id' => $this->institution->id,
                'is_active' => true,
            ]
        );

        $this->group = Group::firstOrCreate(
            ['name' => 'Groupe 1', 'filiere_id' => $this->filiere->id],
            ['academic_year_id' => $this->academicYear->id, 'semester_number' => 5]
        );

        $profUser = User::factory()->create(['institution_id' => $this->institution->id]);
        $this->professor = Professor::create([
            'user_id' => $profUser->id,
            'department_id' => $department->id,
            'specialty' => 'Ressources Humaines',
            'contract_type' => 'permanent',
            'is_active' => true,
            'institution_id' => $this->institution->id,
        ]);

        $studentUser = User::factory()->create(['institution_id' => $this->institution->id]);
        $this->student = Student::create([
            'user_id' => $studentUser->id,
            'student_number' => 'ENCG-2026-GRH01',
            'cne' => 'M130008899',
            'gender' => 'male',
            'status' => 'active',
            'institution_id' => $this->institution->id,
        ]);

        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $this->adminUser = User::factory()->create(['institution_id' => $this->institution->id]);
        $this->adminUser->assignRole($adminRole);
    }

    public function test_attendance_session_creation_and_absence_recording(): void
    {
        Sanctum::actingAs($this->adminUser);

        // 1. Create an attendance session
        $session = AttendanceSession::create([
            'module_id' => $this->module->id,
            'group_id' => $this->group->id,
            'academic_year_id' => $this->academicYear->id,
            'professor_id' => $this->professor->id,
            'professor_type' => Professor::class,
            'session_date' => now()->toDateString(),
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
            'session_type' => 'cm',
            'created_by' => $this->adminUser->id,
            'status' => 'active',
        ]);

        // 2. Mark student absent
        $record = AttendanceRecord::create([
            'attendance_session_id' => $session->id,
            'student_id' => $this->student->id,
            'status' => 'absent',
            'version' => 1,
        ]);

        $this->assertEquals('absent', $record->status->value);
        $this->assertEquals($session->id, $record->attendance_session_id);
    }

    public function test_absence_justification_submission_and_approval(): void
    {
        Sanctum::actingAs($this->adminUser);

        $session = AttendanceSession::create([
            'module_id' => $this->module->id,
            'group_id' => $this->group->id,
            'academic_year_id' => $this->academicYear->id,
            'professor_id' => $this->professor->id,
            'professor_type' => Professor::class,
            'session_date' => now()->toDateString(),
            'start_time' => '10:45:00',
            'end_time' => '12:45:00',
            'session_type' => 'td',
            'created_by' => $this->adminUser->id,
            'status' => 'closed',
        ]);

        $attendance = Attendance::create([
            'attendance_session_id' => $session->id,
            'student_id' => $this->student->id,
            'status' => 'absent',
            'version' => 1,
        ]);

        // Submit medical justification
        $justification = AbsenceJustification::create([
            'attendance_id' => $attendance->id,
            'student_id' => $this->student->id,
            'reason' => 'Certificat médical délivré par le CHU Hassan II',
            'status' => 'pending',
        ]);

        // Admin approves justification
        $justification->update([
            'status' => 'approved',
            'reviewed_by' => $this->adminUser->id,
            'reviewed_at' => now(),
        ]);

        $this->assertEquals('approved', $justification->fresh()->status);
    }
}
