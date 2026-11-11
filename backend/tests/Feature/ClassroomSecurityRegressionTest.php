<?php

namespace Tests\Feature;

use App\Models\Campus;
use App\Models\Group;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\StudentPathway;
use App\Models\User;
use App\Services\Security\ClassroomAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class ClassroomSecurityRegressionTest extends TestCase
{
    use RefreshDatabase;

    private function context(): array
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        app()->instance('academic.context.year', $year->id);
        $filiere = $this->makeTestFiliere();
        $module = $this->makeTestModule($filiere->id, ['semester_number' => 1]);
        $group = Group::create(['name' => 'AUDIT-S1-G1', 'filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'semester_number' => 1]);

        return [$year, $filiere, $module, $group];
    }

    public function test_unassigned_professor_cannot_export_a_group(): void
    {
        [$year, $filiere, $module, $group] = $this->context();
        $professor = $this->makeTestProfessor();
        $professor->user->assignRole(Role::findOrCreate('professor', 'sanctum'));
        Sanctum::actingAs($professor->user);
        $student = $this->makeTestStudent();
        StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'group_id' => $group->id, 'current_semester' => 1, 'is_current' => true]);

        $this->get('/api/professor-portal/student-lists/excel?group_id='.$group->id)->assertForbidden();
    }

    public function test_polymorphic_schedule_identity_collision_is_rejected(): void
    {
        [$year, $filiere, $module, $group] = $this->context();
        $actor = User::factory()->create(['id' => 300, 'institution_id' => 1]);
        $actor->assignRole(Role::findOrCreate('professor', 'sanctum'));
        $victimProfessor = $this->makeTestProfessor();
        $victimProfessor->forceFill(['id' => $actor->id])->save();
        $this->makeTestProfessor(['user' => $actor]);
        $semester = $this->makeTestSemester($year->id);
        $campus = Campus::create(['institution_id' => 1, 'name' => 'Audit campus', 'code' => 'AUDIT']);
        $room = Room::create(['institution_id' => 1, 'campus_id' => $campus->id, 'name' => 'Audit room', 'code' => 'AUDIT-R', 'type' => 'classroom', 'capacity' => 30]);
        Schedule::create(['institution_id' => 1, 'academic_year_id' => $year->id, 'semester_id' => $semester->id, 'group_id' => $group->id, 'module_id' => $module->id, 'room_id' => $room->id, 'professor_id' => $victimProfessor->id, 'professor_type' => Professor::class, 'session_type' => 'cm', 'day_of_week' => 1, 'start_time' => '08:00', 'end_time' => '10:00']);

        $this->expectException(HttpException::class);
        app(ClassroomAccessService::class)->authorize($actor, $module, $group, write: true);
    }

    public function test_unassigned_professor_cannot_send_a_group_convocation(): void
    {
        Mail::fake();
        [$year, $filiere, $module, $group] = $this->context();
        $professor = $this->makeTestProfessor();
        $professor->user->assignRole(Role::findOrCreate('professor', 'sanctum'));
        Sanctum::actingAs($professor->user);
        $student = $this->makeTestStudent();

        $this->postJson('/api/professor-portal/student-lists/rattrapage-convocation', [
            'group_id' => $group->id,
            'module_id' => $module->id,
            'student_ids' => [$student->id],
        ])->assertForbidden();
    }

    public function test_unscoped_filiere_head_cannot_write_an_unassigned_module(): void
    {
        [$year, $filiere, $module, $group] = $this->context();
        $professor = $this->makeTestProfessor();
        $professor->user->assignRole(Role::findOrCreate('filiere-head', 'sanctum'));

        $this->expectException(HttpException::class);
        app(ClassroomAccessService::class)->authorize($professor->user, $module, $group, write: true);
    }
    private function assignedContext(): array
    {
        [$year, $filiere, $module, $group] = $this->context();
        $prof = $this->makeTestProfessor();
        $prof->user->assignRole(Role::findOrCreate('professor', 'sanctum'));
        $module->professors()->attach($prof->id, ['academic_year_id' => $year->id, 'group_id' => $group->id, 'professor_type' => Professor::class, 'session_type' => 'cm']);
        Sanctum::actingAs($prof->user);
        return [$year, $filiere, $module, $group, $prof];
    }

    public function test_assigned_professor_can_export_and_cannot_convocate_an_outsider(): void
    {
        Mail::fake();
        [$year, $filiere, $module, $group] = $this->assignedContext();
        $student = $this->makeTestStudent();
        StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'group_id' => $group->id, 'current_semester' => 1, 'is_current' => true]);
        $this->get('/api/professor-portal/student-lists/excel?group_id='.$group->id.'&module_id='.$module->id)->assertOk();
        $this->postJson('/api/professor-portal/student-lists/rattrapage-convocation', ['group_id' => $group->id, 'module_id' => $module->id, 'student_ids' => [$student->id]])->assertOk();
        Mail::assertSent(\App\Mail\RattrapageConvocationMail::class, 1);
        $outsider = $this->makeTestStudent();
        $this->postJson('/api/professor-portal/student-lists/rattrapage-convocation', ['group_id' => $group->id, 'module_id' => $module->id, 'student_ids' => [$outsider->id]])->assertUnprocessable();
        Mail::assertSent(\App\Mail\RattrapageConvocationMail::class, 1);
    }

    public function test_active_substitution_grants_access_and_revoked_substitution_does_not(): void
    {
        [$year, $filiere, $module, $group] = $this->context();
        $original = $this->makeTestProfessor();
        $substitute = $this->makeTestProfessor();
        $substitute->user->assignRole(Role::findOrCreate('professor', 'sanctum'));
        $replacement = \App\Models\ProfessorSubstitution::create(['original_professor_id' => $original->id, 'substitute_professor_id' => $substitute->id, 'module_id' => $module->id, 'status' => 'active', 'start_date' => now()->subDay(), 'end_date' => now()->addDay()]);
        app(ClassroomAccessService::class)->authorize($substitute->user, $module, $group, write: true);
        $replacement->update(['status' => 'revoked']);
        $this->expectException(HttpException::class);
        app(ClassroomAccessService::class)->authorize($substitute->user, $module, $group, write: true);
    }

    public function test_annual_twin_roster_is_used_for_qr_membership_without_borrowing_other_levels(): void
    {
        [$year, $filiere, $module, $group, $prof] = $this->assignedContext();
        $group->update(['name' => 'AUDIT-S1-G1']);
        $twin = Group::create(['name' => 'AUDIT-S2-G1', 'filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'semester_number' => 2]);
        $student = $this->makeTestStudent();
        StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'group_id' => $twin->id, 'current_semester' => 2, 'is_current' => true]);
        $session = app(\App\Services\Academic\AttendanceService::class)->startSession($module->id, $group->id, $prof->user_id, 'Audit');
        $this->assertDatabaseHas('attendances', ['attendance_session_id' => $session->id, 'student_id' => $student->id, 'status' => 'absent']);
        $student->user->assignRole(Role::findOrCreate('student', 'sanctum'));
        Sanctum::actingAs($student->user);
        $this->postJson('/api/v1/mobile/student/attendance/scan', ['qr_token' => $session->qr_token])->assertOk();
        $outsider = $this->makeTestStudent();
        $outsider->user->assignRole(Role::findOrCreate('student', 'sanctum'));
        Sanctum::actingAs($outsider->user);
        $this->postJson('/api/v1/mobile/student/attendance/scan', ['qr_token' => $session->qr_token])->assertForbidden();
        $session->update(['expires_at' => now()->subMinute()]);
        Sanctum::actingAs($student->user);
        $this->postJson('/api/v1/mobile/student/attendance/scan', ['qr_token' => $session->qr_token])->assertNotFound();
    }

    public function test_pfe_criteria_are_persisted_and_cannot_be_forged_or_overwritten(): void
    {
        [$year, $filiere, $module, $group, $prof] = $this->assignedContext();
        $student = $this->makeTestStudent();
        $stage = \App\Models\Internship::create(['student_id' => $student->id, 'company_name' => 'Audit', 'type' => 'fin_etudes', 'start_date' => now()->subMonths(2), 'end_date' => now(), 'status' => 'active', 'supervisor_id' => $prof->id]);
        $defense = \App\Models\Soutenance::create(['internship_id' => $stage->id, 'president_id' => $prof->id, 'examiner_id' => $prof->id, 'supervisor_id' => $prof->id, 'date_time' => now()->subHour(), 'status' => 'scheduled']);
        $payload = ['grade' => 16, 'remarks' => 'Audit', 'criteria' => ['written_report' => 4, 'methodology' => 5, 'oral_defense' => 3, 'defense_answers' => 4]];
        $url = '/api/professor/internships/soutenances/'.$defense->id.'/evaluate';
        $this->postJson($url, [...$payload, 'grade' => 20])->assertUnprocessable();
        $this->postJson($url, $payload)->assertOk();
        $this->assertSame($payload['criteria'], $defense->fresh()->evaluation_criteria);
        $this->assertDatabaseHas('soutenances', ['id' => $defense->id, 'status' => 'completed', 'grade' => 16]);
        $this->postJson($url, $payload)->assertConflict();
        $this->get('/api/professor/internships/soutenances/'.$defense->id.'/pv')->assertOk()->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_textbook_sync_keeps_groups_separate_and_uses_the_declared_duration(): void
    {
        [$year, $filiere, $module, $group, $prof] = $this->assignedContext();
        $second = Group::create(['name' => 'AUDIT-S1-G2', 'filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'semester_number' => 1]);
        $module->professors()->attach($prof->id, ['academic_year_id' => $year->id, 'group_id' => $second->id, 'professor_type' => Professor::class, 'session_type' => 'cm']);
        foreach ([$group, $second] as $target) {
            $student = $this->makeTestStudent();
            StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'group_id' => $target->id, 'current_semester' => 1, 'is_current' => true]);
            $this->postJson('/api/professor-portal/student-lists/attendance', ['group_id' => $target->id, 'module_id' => $module->id, 'session_date' => now()->toDateString(), 'seance_code' => 'S1', 'sync_textbook' => true, 'session_duration_hours' => 3.5, 'absent_ids' => []])->assertOk();
        }
        $this->assertSame(2, \App\Models\Textbook::where('module_id', $module->id)->count());
        $this->assertDatabaseHas('textbooks', ['group_id' => $group->id, 'session_duration_hours' => 3.5]);
        $this->assertDatabaseHas('textbooks', ['group_id' => $second->id, 'session_duration_hours' => 3.5]);
    }

    public function test_absence_warning_excludes_justified_and_previous_year_records(): void
    {
        [$year, $filiere, $module, $group, $prof] = $this->assignedContext();
        $student = $this->makeTestStudent();
        StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'group_id' => $group->id, 'current_semester' => 1, 'is_current' => true]);
        foreach ([[false, $year->id], [true, $year->id], [false, 1]] as [$justified, $yearId]) {
            $session = \App\Models\AttendanceSession::create(['module_id' => $module->id, 'group_id' => $group->id, 'academic_year_id' => $yearId, 'professor_id' => $prof->id, 'professor_type' => Professor::class, 'created_by' => $prof->user_id, 'session_date' => now()->toDateString(), 'start_time' => '08:00', 'end_time' => '10:00', 'session_type' => 'cm', 'status' => 'completed']);
            \App\Models\Attendance::create(['attendance_session_id' => $session->id, 'student_id' => $student->id, 'status' => 'absent', 'is_justified' => $justified]);
        }
        $this->getJson('/api/professor/attendance/students?module_id='.$module->id.'&group_id='.$group->id)->assertOk()->assertJsonPath('data.0.absence_count', 1);
    }

}
