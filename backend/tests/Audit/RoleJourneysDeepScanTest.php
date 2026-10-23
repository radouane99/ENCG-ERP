<?php

namespace Tests\Audit;

use App\Models\{AcademicYear, Assessment, Grade, GradeAppeal, Internship, ModulePvSignature, Professor, ProfessorAvailability, Soutenance, Student, StudentPathway, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB, Http, Mail};
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/** Audit-only probes: failing assertions describe the expected protection, not a passing production certification. */
class RoleJourneysDeepScanTest extends TestCase
{
    use RefreshDatabase;

    private function login(User $user, string $role): void
    {
        $user->assignRole(Role::findOrCreate($role, 'sanctum'));
        Sanctum::actingAs($user);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake(); Http::preventStrayRequests();
    }

    private function observed(string $probe, array $data): void
    {
        fwrite(STDOUT, "\nAUDIT ".json_encode(['probe' => $probe] + $data)."\n");
    }

    private function academicContext(): array
    {
        $year = $this->makeTestAcademicYear(); $filiere = $this->makeTestFiliere();
        $module = $this->makeTestModule($filiere->id, ['semester_number' => 3]);
        $student = $this->makeTestStudent();
        $pathway = StudentPathway::create(['student_id' => $student->id, 'filiere_id' => $filiere->id,
            'academic_year_id' => $year->id, 'current_semester' => 3, 'is_current' => true]);
        return compact('year', 'filiere', 'module', 'student', 'pathway');
    }

    private function renewalPayload(): array { return ['phone' => '0612345678', 'address' => 'Synthetic address', 'city' => 'Fes']; }

    public function test_renewal_cannot_advance_two_semesters_on_every_retry(): void
    {
        $c = $this->academicContext(); $this->login($c['student']->user, 'student');
        $a = $this->postJson('/api/student-portal/reinscription/confirm', $this->renewalPayload());
        $first = $c['pathway']->fresh()->current_semester;
        $b = $this->postJson('/api/student-portal/reinscription/confirm', $this->renewalPayload());
        $second = $c['pathway']->fresh()->current_semester;
        $this->observed('renewal_retry', ['first_http' => $a->status(), 'second_http' => $b->status(), 'first_semester' => $first, 'second_semester' => $second, 'annual_registrations' => DB::table('student_registrations')->count()]);
        $a->assertOk(); $b->assertOk(); $this->assertSame($first, $second);
    }

    public function test_client_claim_of_payment_is_not_a_verified_payment(): void
    {
        $c = $this->academicContext(); $paid = $this->makeTestFiliere(['code' => 'PAID-AUDIT', 'type' => 'formation_continue']);
        $this->login($c['student']->user, 'student');
        $r = $this->postJson('/api/student-portal/reinscription/confirm', $this->renewalPayload() + ['filiere_id' => $paid->id, 'payment_status' => 'paid', 'payment_provider' => 'cmi']);
        $this->observed('unverified_payment', ['http' => $r->status(), 'new_filiere' => $c['pathway']->fresh()->filiere_id, 'target_filiere' => $paid->id]);
        $r->assertStatus(402);
    }

    public function test_payment_rejection_does_not_activate_the_student(): void
    {
        $c = $this->academicContext(); $c['filiere']->update(['type' => 'formation_continue']); $c['student']->update(['status' => 'pending']);
        $this->login($c['student']->user, 'student');
        $r = $this->postJson('/api/student-portal/reinscription/confirm', $this->renewalPayload());
        $this->observed('renewal_rejected_side_effect', ['http' => $r->status(), 'student_status' => $c['student']->fresh()->status]);
        $r->assertStatus(402); $this->assertSame('pending', $c['student']->fresh()->status);
    }

    public function test_appeal_is_rejected_when_the_reported_window_is_closed(): void
    {
        $c = $this->academicContext(); $this->login($c['student']->user, 'student');
        $window = $this->getJson('/api/student-portal/grade-appeals')->json('data.appeal_window.is_open');
        $r = $this->postJson('/api/student-portal/grade-appeals', ['module_id' => $c['module']->id, 'original_grade' => 1,
            'reason_category' => 'erreur_materielle', 'student_justification' => 'Synthetic audit appeal outside publication window.']);
        $this->observed('closed_appeal_window', ['window_open' => $window, 'http' => $r->status(), 'persisted' => GradeAppeal::count()]);
        $this->assertFalse($window); $r->assertUnprocessable();
    }

    public function test_appeal_assessment_must_belong_to_the_claimed_module(): void
    {
        $c = $this->academicContext(); $other = $this->makeTestModule($c['filiere']->id);
        $assessment = $this->createTestAssessment(['module_id' => $other->id, 'type' => 'Exam', 'weight' => 100, 'academic_year_id' => $c['year']->id]);
        $this->login($c['student']->user, 'student');
        $r = $this->postJson('/api/student-portal/grade-appeals', ['module_id' => $c['module']->id, 'assessment_id' => $assessment->id,
            'original_grade' => 7, 'reason_category' => 'erreur_materielle', 'student_justification' => 'Synthetic unrelated module assessment.']);
        $this->observed('appeal_wrong_assessment', ['http' => $r->status(), 'persisted' => GradeAppeal::count()]);
        $r->assertUnprocessable();
    }

    private function appeal(array $c, ?int $assessment = null): GradeAppeal
    {
        return GradeAppeal::create(['student_id' => $c['student']->id, 'module_id' => $c['module']->id, 'assessment_id' => $assessment,
            'original_grade' => 8, 'old_grade' => 8, 'reason' => 'Synthetic audit', 'status' => 'submitted']);
    }

    public function test_rectification_without_any_grade_cannot_report_success(): void
    {
        $c = $this->academicContext(); $appeal = $this->appeal($c); $this->login(User::factory()->create(['institution_id' => 1]), 'institution-admin');
        $r = $this->postJson('/api/admin/grade-appeals/'.$appeal->id.'/resolve', ['decision' => 'rectified', 'rectified_grade' => 18]);
        $this->observed('rectification_without_grade', ['http' => $r->status(), 'appeal_status' => $appeal->fresh()->status, 'grades' => Grade::count()]);
        $r->assertUnprocessable();
    }

    public function test_a_signed_module_grade_cannot_be_rewritten_by_ordinary_appeal_resolution(): void
    {
        $c = $this->academicContext(); $assessment = $this->createTestAssessment(['module_id' => $c['module']->id, 'type' => 'Exam', 'weight' => 100, 'academic_year_id' => $c['year']->id]);
        $grade = Grade::create(['student_id' => $c['student']->id, 'assessment_id' => $assessment->id, 'value' => 8, 'absent' => false]);
        $appeal = $this->appeal($c, $assessment->id); $user = User::factory()->create(['institution_id' => 1]); $this->login($user, 'institution-admin');
        ModulePvSignature::create(['module_id' => $c['module']->id, 'academic_year_id' => $c['year']->id, 'signed_by' => $user->id, 'signed_at' => now(), 'signature_data' => 'synthetic-signature', 'digital_seal' => hash('sha256', 'synthetic-seal')]);
        $r = $this->postJson('/api/admin/grade-appeals/'.$appeal->id.'/resolve', ['decision' => 'rectified', 'rectified_grade' => 18]);
        $this->observed('signed_grade_appeal_bypass', ['http' => $r->status(), 'grade_after' => $grade->fresh()->value]);
        $this->assertSame(8.0, $grade->fresh()->value);
    }

    public function test_professor_only_sees_supervised_internships(): void
    {
        $c = $this->academicContext(); $owner = $this->makeTestProfessor(); $stranger = $this->makeTestProfessor();
        $stage = Internship::create(['student_id' => $c['student']->id, 'supervisor_id' => $owner->id, 'type' => 'fin_etudes', 'company_name' => 'Synthetic', 'start_date' => '2026-10-01', 'end_date' => '2027-01-01', 'status' => 'active']);
        $this->login($stranger->user, 'professor'); $r = $this->getJson('/api/professor/internships/supervised');
        $this->observed('unrelated_professor_internships', ['http' => $r->status(), 'listed_ids' => collect($r->json('internships'))->pluck('id')->all()]);
        $r->assertOk(); $this->assertNotContains($stage->id, collect($r->json('internships'))->pluck('id')->all());
    }

    public function test_unrelated_professor_cannot_complete_someone_elses_internship(): void
    {
        $c = $this->academicContext(); $owner = $this->makeTestProfessor(); $stranger = $this->makeTestProfessor();
        $stage = Internship::create(['student_id' => $c['student']->id, 'supervisor_id' => $owner->id, 'type' => 'fin_etudes', 'company_name' => 'Synthetic', 'start_date' => '2026-10-01', 'end_date' => '2027-01-01', 'status' => 'active']);
        $this->login($stranger->user, 'professor');
        $r = $this->postJson('/api/professor/internships/update-status', ['internship_id' => $stage->id, 'status' => 'completed']);
        $this->observed('unrelated_professor_stage_mutation', ['http' => $r->status(), 'status_after' => $stage->fresh()->status->value]);
        $r->assertForbidden();
    }

    public function test_professor_outside_jury_cannot_grade_a_defense(): void
    {
        $c = $this->academicContext(); $owner = $this->makeTestProfessor(); $stranger = $this->makeTestProfessor();
        $stage = Internship::create(['student_id' => $c['student']->id, 'supervisor_id' => $owner->id, 'type' => 'fin_etudes', 'company_name' => 'Synthetic', 'start_date' => '2026-10-01', 'end_date' => '2027-01-01', 'status' => 'active']);
        $s = Soutenance::create(['internship_id' => $stage->id, 'president_id' => $owner->id, 'examiner_id' => $owner->id, 'date_time' => now()->addDay(), 'status' => 'scheduled']);
        $this->login($stranger->user, 'professor');
        $r = $this->postJson('/api/professor/internships/soutenances/'.$s->id.'/evaluate', ['grade' => 19, 'remarks' => 'Synthetic unauthorized evaluation']);
        $this->observed('outside_jury_evaluation', ['http' => $r->status(), 'grade_after' => $s->fresh()->grade]);
        $r->assertForbidden();
    }

    public function test_student_cannot_self_certify_school_signature_and_insurance(): void
    {
        $this->withoutExceptionHandling();
        $c = $this->academicContext(); $this->login($c['student']->user, 'student');
        $r = $this->postJson('/api/student-portal/internships/conventions', ['type' => 'fin_etudes', 'company_name' => 'Synthetic company',
            'company_mentor_name' => 'Synthetic mentor', 'supervisor_email' => 'synthetic@example.test', 'position_title' => 'Synthetic position', 'start_date' => '2027-02-01', 'end_date' => '2027-05-01']);
        $this->observed('self_certified_convention', ['http' => $r->status(), 'convention_status' => $r->json('data.convention_status'), 'insurance_verified' => $r->json('data.insurance_verified')]);
        $r->assertCreated(); $this->assertNotSame('school_signed', $r->json('data.convention_status'));
    }

    public function test_availability_uses_the_user_key_expected_by_the_foreign_key(): void
    {
        $this->withoutExceptionHandling();
        $this->makeTestAcademicYear(); $this->makeTestStudent(); $prof = $this->makeTestProfessor();
        $this->assertNotSame($prof->id, $prof->user_id); $this->login($prof->user, 'professor');
        $r = $this->postJson('/api/professor/availability/my', ['availability' => ['Lundi' => ['matin' => true, 'apresMidi' => false]], 'notes' => 'Synthetic availability']);
        $this->observed('availability_identity', ['http' => $r->status(), 'professor_profile_id' => $prof->id, 'expected_user_id' => $prof->user_id, 'stored_key' => DB::table('professor_availabilities')->value('professor_id')]);
        $r->assertOk(); $this->assertDatabaseHas('professor_availabilities', ['professor_id' => $prof->user_id]);
    }

    public function test_student_does_not_see_a_fabricated_average_without_grades(): void
    {
        $c = $this->academicContext(); $this->login($c['student']->user, 'student');
        $r = $this->getJson('/api/student-portal/reinscription/status');
        $this->observed('empty_grades_average', ['http' => $r->status(), 'average' => $r->json('data.average_grade'), 'admitted' => $r->json('data.is_admis')]);
        $r->assertOk(); $this->assertNull($r->json('data.average_grade'));
    }
}
