<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\User;
use App\Support\AuthCookie;
use App\Support\SignedDocumentUrl;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BackendSecurityNormsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-norms']
        );
    }

    public function test_track_dossier_requires_cne_and_cin_for_guests(): void
    {
        $this->getJson('/api/public/track-dossier?cne=N142088916')
            ->assertStatus(422);
    }

    public function test_serve_document_without_signature_is_forbidden(): void
    {
        $this->getJson('/api/public/serve-document/cnie/N142088916')
            ->assertStatus(403);
    }

    public function test_track_dossier_with_cne_and_cin_returns_signed_document_urls(): void
    {
        $user = User::factory()->create(['cin' => 'AB123456']);
        $student = Student::create([
            'user_id' => $user->id,
            'student_number' => 'ENCG-NORMS-001',
            'cne' => 'N142099001',
            'gender' => 'male',
            'status' => 'pre_inscri',
            'institution_id' => 1,
        ]);

        StudentDocument::create([
            'student_id' => $student->id,
            'cne' => $student->cne,
            'type' => 'bac',
            'file_path' => 'candidate_documents/bac.pdf',
            'original_filename' => 'bac.pdf',
            'status' => 'pending',
        ]);

        $response = $this->getJson('/api/public/track-dossier?cne=N142099001&cin=AB123456');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $filePath = $response->json('candidate.documents.bac.file_path');
        $this->assertIsString($filePath);
        $this->assertStringContainsString('sig=', $filePath);
        $this->assertStringNotContainsString('/storage/', $filePath);
    }

    public function test_signed_document_url_grants_access(): void
    {
        $user = User::factory()->create(['cin' => 'CD654321']);
        $student = Student::create([
            'user_id' => $user->id,
            'student_number' => 'ENCG-NORMS-002',
            'cne' => 'N142099002',
            'cin' => 'CD654321',
            'gender' => 'female',
            'status' => 'pre_inscri',
            'institution_id' => 1,
        ]);

        $relative = 'candidate_documents/test-cnie.pdf';
        Storage::disk('private')->put($relative, '%PDF-1.4 test');

        StudentDocument::create([
            'student_id' => $student->id,
            'cne' => $student->cne,
            'type' => 'cnie',
            'file_path' => $relative,
            'original_filename' => 'cnie.pdf',
            'mime_type' => 'application/pdf',
            'status' => 'pending',
        ]);

        $url = SignedDocumentUrl::make('cnie', $student->cne);
        $this->get($url)->assertOk();
    }

    public function test_query_token_does_not_authenticate_arbitrary_api_routes(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $this->getJson('/api/v1/auth/me?token='.urlencode($token))
            ->assertUnauthorized();
    }

    public function test_http_only_auth_cookie_authenticates_without_authorization_header(): void
    {
        $user = User::factory()->create([
            'email' => 'norms.cookie@encg-fes.ac.ma',
            'password' => 'Password1!',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Password1!',
        ]);

        $login->assertOk();
        $this->assertArrayNotHasKey('token', $login->json('data') ?? []);

        $cookie = $login->getCookie(AuthCookie::NAME, false);
        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isHttpOnly());

        $this->call('GET', '/api/v1/auth/me', [], [
            AuthCookie::NAME => $cookie->getValue(),
        ], [], [
            'HTTP_ACCEPT' => 'application/json',
        ])->assertOk()
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_login_response_does_not_include_password_or_login_ip(): void
    {
        $user = User::factory()->create([
            'email' => 'norms.login@encg-fes.ac.ma',
            'password' => 'Password1!',
            'last_login_ip' => '10.0.0.9',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Password1!',
        ]);

        $response->assertOk();
        $payload = $response->json('data.user');
        $this->assertArrayNotHasKey('password', $payload);
        $this->assertArrayNotHasKey('last_login_ip', $payload);
        $this->assertArrayNotHasKey('two_factor_secret', $payload);
    }

    public function test_professor_cannot_manage_roles_permissions(): void
    {
        $role = Role::firstOrCreate(['name' => 'professor', 'guard_name' => 'sanctum']);
        $user = User::factory()->create();
        $user->assignRole($role);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/roles-permissions/data')
            ->assertForbidden();
    }

    public function test_inscription_status_requires_cne_and_cin(): void
    {
        $this->getJson('/api/public/inscription/status?cne=N142088916')
            ->assertStatus(422);
    }

    public function test_track_dossier_matches_cin_on_users_not_students(): void
    {
        $user = User::factory()->create(['cin' => 'ZG195334']);
        Student::create([
            'user_id' => $user->id,
            'student_number' => 'ENCG-NORMS-CIN-USER',
            'cne' => 'H148073298',
            'gender' => 'female',
            'status' => 'pre_inscri',
            'institution_id' => 1,
        ]);

        $this->getJson('/api/public/track-dossier?cne=H148073298&cin=ZG195334')
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}
