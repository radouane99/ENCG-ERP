<?php

namespace Tests\Audit;

use App\Models\Internship;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProductionModeBoundaryAuditTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Http::preventStrayRequests();
    }

    private function login(User $user, string $role): void
    {
        $user->assignRole(Role::findOrCreate($role, 'sanctum'));
        Sanctum::actingAs($user);
    }

    private function observed(string $probe, array $data): void
    {
        fwrite(STDOUT, "\nAUDIT ".json_encode(['probe' => $probe] + $data)."\n");
    }

    public function test_production_mass_assignment_mode_does_not_allow_self_certified_insurance(): void
    {
        $this->makeTestAcademicYear();
        $s = $this->makeTestStudent();
        $this->login($s->user, 'student');
        // Mirrors AppServiceProvider::bootEloquent in production, preserving all database constraints.
        Model::preventSilentlyDiscardingAttributes(false);
        try {
            $r = $this->postJson('/api/student-portal/internships/conventions', ['type' => 'fin_etudes', 'company_name' => 'Synthetic company',
                'company_mentor_name' => 'Synthetic mentor', 'supervisor_email' => 'synthetic@example.test', 'position_title' => 'Synthetic position',
                'start_date' => '2027-02-01', 'end_date' => '2027-05-01']);
        } finally {
            Model::preventSilentlyDiscardingAttributes(true);
        }
        $this->observed('production_convention', ['http' => $r->status(), 'insurance_verified' => $r->json('data.insurance_verified'), 'school_status' => $r->json('data.convention_status'), 'persisted' => Internship::count()]);
        $r->assertCreated();
        $this->assertNotSame('school_signed', $r->json('data.convention_status'));
    }

    public function test_production_availability_does_not_write_the_wrong_users_key(): void
    {
        $this->makeTestAcademicYear();
        $decoy = User::factory()->create(['institution_id' => 1]);
        $prof = $this->makeTestProfessor();
        // Valid but deliberately unequal user/profile keys reproduce an ordinary relational-key collision.
        $prof->id = $decoy->id;
        $prof->save();
        $this->login($prof->user, 'professor');
        Model::preventSilentlyDiscardingAttributes(false);
        try {
            $r = $this->postJson('/api/professor/availability/my', ['availability' => ['Lundi' => ['matin' => true, 'apresMidi' => false]], 'notes' => 'Synthetic']);
        } finally {
            Model::preventSilentlyDiscardingAttributes(true);
        }
        $this->observed('production_availability', ['http' => $r->status(), 'expected_user' => $prof->user_id, 'stored_user' => DB::table('professor_availabilities')->value('professor_id')]);
        $r->assertOk();
        $this->assertDatabaseHas('professor_availabilities', ['professor_id' => $prof->user_id]);
    }

    public function test_registered_user_creation_route_has_a_callable_controller_action(): void
    {
        $user = User::factory()->create(['institution_id' => 1]);
        $this->login($user, 'institution-admin');
        $user->givePermissionTo(Permission::findOrCreate('users.manage', 'sanctum'));
        Role::findOrCreate('professor', 'sanctum');
        $this->withoutExceptionHandling();
        $this->postJson('/api/users', ['name' => 'Synthetic staff', 'email' => 'synthetic-new@example.test', 'password' => 'SyntheticPassword123!', 'role' => 'professor'])->assertCreated();
    }

    public function test_user_details_accept_the_uuid_exposed_by_the_user_resource(): void
    {
        $actor = User::factory()->create(['institution_id' => 1]);
        $target = User::factory()->create(['institution_id' => 1]);
        $this->login($actor, 'institution-admin');
        $actor->givePermissionTo(Permission::findOrCreate('users.view', 'sanctum'));
        $r = $this->getJson('/api/users/'.$target->uuid);
        $this->observed('user_resource_uuid_lookup', ['http' => $r->status(), 'resource_identifier_kind' => 'uuid']);
        $r->assertOk();
    }
}
