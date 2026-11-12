<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\Auth\SessionController;
use App\Models\Group;
use App\Models\StudentDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuditRemediationRegressionTest extends TestCase
{
    use RefreshDatabase;

    private function actor(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate($role, 'sanctum'));
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_public_personal_pdf_aliases_require_authentication(): void
    {
        $this->getJson('/api/public/engagement-pdf?student_id=1')->assertUnauthorized();
        $this->getJson('/api/public/fiche-medicale-pdf')->assertUnauthorized();
        $this->getJson('/api/public/recepisse-tafem-pdf?application_id=1')->assertUnauthorized();
    }

    public function test_read_only_staff_cannot_read_a_students_medical_pdf(): void
    {
        $student = $this->makeTestStudent();
        $this->actor('library-manager');
        $this->getJson('/api/public/fiche-medicale-pdf?student_id='.$student->id)->assertForbidden();
    }

    public function test_unverified_passkey_login_does_not_issue_a_token(): void
    {
        $user = User::factory()->create();
        Cache::put('passkey_lookup:dummy-victim', ['user_id' => $user->id, 'public_key' => 'dummy'], 60);
        Cache::put('passkey_auth_challenge:dummy', 'dummy', 60);
        $this->postJson('/api/v1/auth/passkeys/login', [
            'credential_id' => 'dummy-victim', 'challenge_id' => 'dummy', 'signature' => 'invalid',
        ])->assertStatus(503)->assertJsonMissingPath('data.token');
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_passkey_deletion_requires_ownership_and_preserves_other_lookup(): void
    {
        $this->actor('professor');
        $victim = User::factory()->create();
        Cache::put('passkey_lookup:dummy-victim', ['user_id' => $victim->id], 60);
        $this->deleteJson('/api/v1/auth/passkeys/dummy-victim')->assertNotFound();
        $this->assertSame($victim->id, Cache::get('passkey_lookup:dummy-victim')['user_id']);
    }

    public function test_sudo_grant_requires_same_real_session_and_explicit_proof(): void
    {
        $user = User::factory()->create(['password' => 'Dummy-Password-42!']);
        $tokenA = $user->createToken('fixture-A')->accessToken;
        $tokenB = $user->createToken('fixture-B')->accessToken;
        $a = User::findOrFail($user->id)->withAccessToken($tokenA);
        $b = User::findOrFail($user->id)->withAccessToken($tokenB);
        $requestA = Request::create('/sudo', 'POST', ['password' => 'Dummy-Password-42!']);
        $requestA->setUserResolver(fn () => $a);
        $data = (new SessionController)->confirmSudoMode($requestA)->getData(true);
        $proof = $data['data']['sudo_token'];
        $this->assertFalse(SessionController::hasActiveSudoMode($a, $requestA));
        $requestA->headers->set('X-Sudo-Token', $proof);
        $this->assertTrue(SessionController::hasActiveSudoMode($a, $requestA));
        $requestB = Request::create('/sudo', 'POST');
        $requestB->headers->set('X-Sudo-Token', $proof);
        $requestB->setUserResolver(fn () => $b);
        $this->assertFalse(SessionController::hasActiveSudoMode($b, $requestB));
        $requestA->headers->set('X-Sudo-Token', 'wrong');
        $this->assertFalse(SessionController::hasActiveSudoMode($a, $requestA));
        $requestA->headers->set('X-Sudo-Token', $proof);
        $this->travel(11)->minutes();
        $this->assertFalse(SessionController::hasActiveSudoMode($a, $requestA));
    }

    public function test_professor_cannot_simulate_unrelated_deliberation(): void
    {
        $this->actor('professor');
        $this->postJson('/api/deliberations/simulate', ['student_id' => 1, 'explain' => false])->assertForbidden();
    }

    public function test_unassigned_attendance_risk_group_is_rejected(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        app()->instance('academic.context.year', $year->id);
        $filiere = $this->makeTestFiliere();
        $this->makeTestModule($filiere->id, ['semester_number' => 1]);
        $group = Group::create(['name' => 'AUDIT', 'filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'semester_number' => 1]);
        $prof = $this->makeTestProfessor();
        $prof->user->assignRole(Role::findOrCreate('professor', 'sanctum'));
        Sanctum::actingAs($prof->user);
        $this->postJson('/api/v1/professor/copilot/attendance-risk-analysis', ['group_id' => $group->id])->assertForbidden();
    }

    public function test_finance_role_alone_cannot_export_professor_records(): void
    {
        $this->actor('finance-officer');
        $this->getJson('/api/export/professors')->assertForbidden();
    }

    public function test_read_only_staff_cannot_replace_a_student_document(): void
    {
        $student = $this->makeTestStudent();
        $this->actor('library-manager');
        Storage::fake('private');
        $this->postJson('/api/students/'.$student->id.'/documents', [
            'type' => 'bac', 'file' => UploadedFile::fake()->create('dummy.pdf', 1, 'application/pdf'),
        ])->assertForbidden();
        $this->assertDatabaseMissing('student_documents', ['student_id' => $student->id]);
        Storage::disk('private')->assertDirectoryEmpty('student_documents');
    }

    public function test_authorized_document_upload_does_not_self_verify(): void
    {
        $student = $this->makeTestStudent();
        $this->actor('admin');
        Storage::fake('private');
        $this->postJson('/api/students/'.$student->id.'/documents', [
            'type' => 'bac', 'file' => UploadedFile::fake()->create('dummy.pdf', 1, 'application/pdf'),
        ])->assertOk();
        $doc = StudentDocument::where('student_id', $student->id)->firstOrFail();
        $this->assertSame('pending', $doc->status);
        Storage::disk('private')->assertExists($doc->file_path);
        $this->postJson('/api/students/'.$student->id.'/documents/'.$doc->id.'/verify', ['version' => 999])->assertConflict();
        $this->postJson('/api/students/'.$student->id.'/documents/'.$doc->id.'/verify', ['version' => $doc->version])->assertOk();
        $this->assertSame('verified', $doc->fresh()->status);
    }
}
