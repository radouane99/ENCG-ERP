<?php
namespace Tests\Feature;

use App\Models\{AcademicYear, AbsenceJustification, Assessment, Attendance, AttendanceSession, Deliberation, DeliberationDecision, DeliberationJury, Grade, Group, ModuleProfessor, Room, StudentRegistration, User};
use App\Services\Academic\{AttendanceService, DeliberationSealService};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AcademicReliabilityTest extends TestCase
{
    use RefreshDatabase;
    private function actor(string $role = 'admin'): User { $user = User::factory()->create(['institution_id' => 1]); $user->assignRole(Role::findOrCreate($role, 'sanctum')); Sanctum::actingAs($user); return $user; }
    private function context(): array {
        $year = $this->ensureAcademicYear(); $year->update(['is_locked' => false, 'is_current' => true, 'start_date' => now()->startOfYear(), 'end_date' => now()->endOfYear()]); $filiere = $this->makeTestFiliere(); $module = $this->makeTestModule($filiere->id); $semester = $this->makeTestSemester($year->id);
        $group = Group::create(['name' => 'Synthetic G1', 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 1]);
        $student = $this->makeTestStudent(); StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'group_id' => $group->id, 'semester_number' => 1, 'registration_type' => 'initial', 'status' => 'admin_validated']);
        return compact('year', 'filiere', 'module', 'semester', 'group', 'student');
    }
    public function test_unlinked_orientation_cannot_fall_back_to_another_student_and_missing_grades_stay_null(): void {
        $c = $this->context(); $this->actor('student');
        $this->getJson('/api/student-portal/orientation/profile')->assertNotFound();
        $c['student']->user->assignRole(Role::findOrCreate('student', 'sanctum')); Sanctum::actingAs($c['student']->user);
        $this->getJson('/api/student-portal/orientation/profile')->assertOk()->assertJsonPath('data.current_semester_modules.0.grade', null)->assertJsonPath('data.total_grades_analyzed', 0)->assertJsonCount(0, 'data.recommendations');
        $a = Assessment::create(['module_id' => $c['module']->id, 'academic_year_id' => $c['year']->id, 'type' => 'exam', 'weight' => 100]);
        Grade::create(['assessment_id' => $a->id, 'student_id' => $c['student']->id, 'value' => 0, 'absent' => false]);
        $this->getJson('/api/student-portal/orientation/profile')->assertOk()->assertJsonPath('data.current_semester_modules.0.grade', 0);
    }
    public function test_registration_only_student_is_in_the_roster_and_closed_calls_cannot_be_changed(): void {
        $c = $this->context(); $teacher = $this->makeTestProfessor(); $teacher->user->assignRole(Role::findOrCreate('professor', 'sanctum')); Sanctum::actingAs($teacher->user);
        ModuleProfessor::create(['module_id' => $c['module']->id, 'group_id' => $c['group']->id, 'professor_id' => $teacher->id, 'professor_type' => \App\Models\Professor::class, 'academic_year_id' => $c['year']->id, 'session_type' => 'cm', 'assigned_hours' => 36]);
        $id = $this->postJson('/api/professor/attendance/start', ['module_id' => $c['module']->id, 'group_id' => $c['group']->id, 'room_name' => 'Synthetic'])->assertCreated()->json('session.id');
        $this->assertDatabaseHas('attendances', ['attendance_session_id' => $id, 'student_id' => $c['student']->id]);
        $this->getJson('/api/v1/professor/attendance/session/'.$id.'/stats')->assertOk()->assertJsonPath('data.absent_count', 1);
        $this->postJson('/api/professor/attendance/'.$id.'/manual-call', ['student_id' => $c['student']->id, 'status' => 'present'])->assertOk();
        $this->postJson('/api/professor/attendance/'.$id.'/close')->assertOk();
        $this->postJson('/api/professor/attendance/'.$id.'/manual-call', ['student_id' => $c['student']->id, 'status' => 'absent'])->assertConflict();
        $other = $this->actor('professor'); $this->getJson('/api/v1/professor/attendance/session/'.$id.'/stats')->assertForbidden();
        Sanctum::actingAs($c['student']->user); $c['student']->user->assignRole(Role::findOrCreate('student', 'sanctum'));
        $this->getJson('/api/student-portal/absences')->assertOk()->assertJsonPath('stats.present_count', 1)->assertJsonPath('stats.absent_count', 0);
    }
    public function test_justification_uses_attendance_id_and_reversal_clears_only_the_correct_absence(): void {
        $c = $this->context(); $admin = $this->actor();
        $teacher = $this->makeTestProfessor(); $session = AttendanceSession::create(['professor_id' => $teacher->id, 'professor_type' => \App\Models\Professor::class, 'session_type' => 'cm','academic_year_id' => $c['year']->id, 'module_id' => $c['module']->id, 'group_id' => $c['group']->id, 'session_date' => now(), 'start_time' => '08:00', 'end_time' => '10:00', 'status' => 'completed', 'created_by' => $admin->id]);
        $other = $this->makeTestStudent(); Attendance::create(['attendance_session_id' => $session->id, 'student_id' => $other->id, 'status' => 'absent']);
        $record = Attendance::create(['attendance_session_id' => $session->id, 'student_id' => $c['student']->id, 'status' => 'absent']);
        $j = AbsenceJustification::create(['attendance_id' => $record->id, 'student_id' => $c['student']->id, 'reason' => 'medical', 'status' => 'pending']);
        $this->patchJson('/api/absences-justifications/'.$j->id.'/status', ['status' => 'approved'])->assertOk();
        $this->assertTrue($record->fresh()->is_justified);
        $this->patchJson('/api/absences-justifications/'.$j->id.'/status', ['status' => 'rejected', 'rejection_reason' => 'Pièce non recevable après contrôle'])->assertOk();
        $this->assertFalse($record->fresh()->is_justified);
    }
    public function test_jury_signature_is_owned_and_persisted_and_seal_prevents_grade_changes(): void {
        $c = $this->context(); $actor = $this->actor('director');
        $jury = DeliberationJury::create(['filiere_id' => $c['filiere']->id, 'academic_year_id' => $c['year']->id, 'semester_number' => 1, 'type' => 'semestriel', 'user_id' => $actor->id, 'role' => 'chef_filiere', 'status' => 'pending']);
        $png = 'data:image/png;base64,'.base64_encode('synthetic-signature');
        $this->actor('admin'); $this->postJson('/api/academic/deliberations/sign-jury', ['jury_id' => $jury->id, 'signature_data' => $png])->assertForbidden();
        Sanctum::actingAs($actor); $this->postJson('/api/academic/deliberations/sign-jury', ['jury_id' => $jury->id, 'signature_data' => $png])->assertOk(); $this->assertSame('signed', $jury->fresh()->status);
        $assessment = Assessment::create(['module_id' => $c['module']->id, 'academic_year_id' => $c['year']->id, 'type' => 'exam', 'weight' => 100]);
        $grade = Grade::create(['student_id' => $c['student']->id, 'assessment_id' => $assessment->id, 'value' => 14, 'absent' => false]);
        $delib = Deliberation::create(['institution_id' => 1, 'filiere_id' => $c['filiere']->id, 'academic_year_id' => $c['year']->id, 'semester_id' => $c['semester']->id, 'type' => 'semester', 'status' => 'completed']);
        DeliberationDecision::create(['deliberation_id' => $delib->id, 'student_id' => $c['student']->id, 'decision' => 'admitted', 'semester_average' => 14]);
        $this->postJson('/api/academic/deliberations/'.$delib->id.'/seal', ['reason' => 'PV validé après contrôle du jury'])->assertOk(); $hash = $delib->fresh()->seal_hash; $this->assertSame(64, strlen($hash));
        try { $grade->update(['value' => 18]); $this->fail('Sealed grade accepted'); } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) { $this->assertSame(423, $e->getStatusCode()); }
        $this->assertEquals(14, $grade->fresh()->value);
    }
    public function test_meeting_is_persisted_versioned_and_notifies_only_portal_without_fake_email_success(): void {
        $c = $this->context(); $admin = $this->actor();
        $room = Room::create(['institution_id' => 1, 'name' => 'Synthetic jury room', 'code' => 'SYN-JURY', 'type' => 'conference', 'capacity' => 10, 'is_available' => true]);
        $payload = ['filiere_id' => $c['filiere']->id, 'academic_year_id' => $c['year']->id, 'semester_number' => 1, 'type' => 'semestriel', 'group_id' => null, 'room_id' => $room->id, 'president_id' => $admin->id, 'member_ids' => [], 'starts_at' => now()->next('Tuesday')->setTime(9, 0)->format('Y-m-d H:i:s'), 'duration_minutes' => 120, 'version' => 0];
        $response = $this->postJson('/api/academic/pv-workflow/meeting', $payload)->assertOk()->assertJsonPath('notifications_portal', 1)->assertJsonPath('email_sent', false);
        $id = $response->json('deliberation_id');
        $this->assertDatabaseHas('deliberation_meetings', ['deliberation_id' => $id, 'room_id' => $room->id, 'version' => 1]);
        $this->getJson('/api/academic/pv-workflow/context?'.http_build_query(array_intersect_key($payload, array_flip(['filiere_id', 'academic_year_id', 'semester_number', 'type']))))->assertOk()->assertJsonPath('meeting.version', 1)->assertJsonPath('deliberation.id', $id);
        $this->postJson('/api/academic/pv-workflow/meeting', $payload)->assertConflict();
        $this->assertSame(1, $admin->notifications()->count());
        $other = $this->makeTestFiliere();
        $this->postJson('/api/academic/pv-workflow/meeting', array_replace($payload, ['filiere_id' => $other->id]))->assertConflict();
        $this->actor('student'); $this->postJson('/api/academic/pv-workflow/meeting', $payload)->assertForbidden();
    }
}
