<?php

namespace Tests\Audit;

use App\Models\{FiliereQuota, Grade, Internship, ProfessorAvailability, SpecialtyWish, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB, Http, Mail};
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\{Permission, Role};
use Tests\TestCase;

class AdministrationDeepScanTest extends TestCase
{
    use RefreshDatabase;
    protected function setUp(): void { parent::setUp(); Mail::fake(); Http::preventStrayRequests(); }
    private function login(User $user, string $role): void { $user->assignRole(Role::findOrCreate($role, 'sanctum')); Sanctum::actingAs($user); }
    private function observed(string $probe, array $data): void { fwrite(STDOUT, "\nAUDIT ".json_encode(['probe' => $probe] + $data)."\n"); }

    public function test_institution_admin_cannot_self_promote_to_super_admin(): void
    {
        $user = User::factory()->create(['institution_id' => 1]); $this->login($user, 'institution-admin');
        $user->givePermissionTo(Permission::findOrCreate('users.manage', 'sanctum')); Role::findOrCreate('super-admin', 'sanctum');
        $r = $this->putJson('/api/users/'.$user->id, ['role' => 'super-admin']);
        $this->observed('self_role_elevation', ['http' => $r->status(), 'super_admin_after' => $user->fresh()->hasRole('super-admin')]);
        $r->assertForbidden();
    }

    public function test_rbac_matrix_cannot_grant_the_actor_super_admin_to_itself(): void
    {
        $user = User::factory()->create(['institution_id' => 1]); $this->login($user, 'institution-admin'); Role::findOrCreate('super-admin', 'sanctum');
        $r = $this->postJson('/api/admin/roles-permissions/users/'.$user->uuid, ['roles' => ['super-admin'], 'permissions' => []]);
        $this->observed('matrix_self_role_elevation', ['http' => $r->status(), 'super_admin_after' => $user->fresh()->hasRole('super-admin')]);
        $r->assertForbidden();
    }

    public function test_specialty_merit_uses_the_actual_grade_value(): void
    {
        $year = $this->makeTestAcademicYear(); $f = $this->makeTestFiliere(); $m = $this->makeTestModule($f->id); $s = $this->makeTestStudent();
        $a = $this->createTestAssessment(['module_id' => $m->id, 'academic_year_id' => $year->id, 'type' => 'Exam', 'weight' => 100]);
        Grade::create(['student_id' => $s->id, 'assessment_id' => $a->id, 'value' => 16, 'absent' => false]); $this->login($s->user, 'student');
        $r = $this->getJson('/api/student-portal/specialty-wishes');
        $this->observed('specialty_merit', ['http' => $r->status(), 'actual_grade' => 16, 'reported_merit' => $r->json('data.student_merit_score')]);
        $r->assertOk(); $this->assertEquals(16, $r->json('data.student_merit_score'));
    }

    public function test_specialty_allocation_respects_the_configured_capacity(): void
    {
        $this->makeTestAcademicYear(); $f = $this->makeTestFiliere();
        FiliereQuota::create(['filiere_id' => $f->id, 'academic_year' => '2026/2027', 'capacity' => 1, 'min_score_required' => 0, 'is_open' => true]);
        foreach ([18, 17] as $score) { $s = $this->makeTestStudent(); SpecialtyWish::create(['student_id' => $s->id, 'filiere_id' => $f->id,
            'preference_rank' => 1, 'academic_year' => '2026/2027', 'calculated_merit_score' => $score, 'allocation_status' => 'pending']); }
        $this->login(User::factory()->create(['institution_id' => 1]), 'institution-admin');
        $r = $this->postJson('/api/admin/specialty-allocation/run');
        $assigned = SpecialtyWish::where('allocation_status', 'assigned')->count();
        $this->observed('specialty_capacity', ['http' => $r->status(), 'configured_capacity' => 1, 'assigned' => $assigned]);
        $r->assertOk(); $this->assertLessThanOrEqual(1, $assigned);
    }

    public function test_cancelled_convention_cannot_be_activated_with_a_public_token(): void
    {
        $this->makeTestAcademicYear(); $s = $this->makeTestStudent();
        $i = Internship::create(['student_id' => $s->id, 'type' => 'fin_etudes', 'company_name' => 'Synthetic', 'start_date' => '2026-10-01',
            'end_date' => '2027-01-01', 'status' => 'cancelled', 'convention_status' => 'cancelled', 'security_token' => 'synthetic-cancelled-token']);
        $r = $this->postJson('/api/public/convention-sign/synthetic-cancelled-token');
        $this->observed('cancelled_company_signature', ['http' => $r->status(), 'convention_status_after' => $i->fresh()->convention_status]);
        $r->assertUnprocessable();
    }

    public function test_professor_availability_index_displays_nested_slots_without_error(): void
    {
        $year = $this->makeTestAcademicYear(); $prof = $this->makeTestProfessor();
        ProfessorAvailability::create(['professor_id' => $prof->user_id, 'academic_year_id' => $year->id, 'status' => 'Soumis',
            'availability_data' => json_encode(['Lundi' => ['matin' => true, 'apresMidi' => false]]), 'available_slots_count' => 1]);
        $this->login($prof->user, 'professor'); $this->withoutExceptionHandling();
        $this->getJson('/api/professor-availability')->assertOk();
    }
}
