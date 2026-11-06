<?php

declare(strict_types=1);

use App\Models\DocumentType;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

// ── Helpers ─────────────────────────────────────────────────────────────────

function ensureInstitution()
{
    Institution::firstOrCreate(
        ['id' => 1],
        ['name' => 'ENCG Test', 'code' => 'ENCG', 'slug' => 'encg-test']
    );
}

function makeAdminUser(): User
{
    ensureInstitution();
    // Flush Spatie permission cache to avoid stale data across tests
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $user = User::factory()->create();

    // Assign a role that passes the route-level role middleware
    $role = Role::firstOrCreate(['name' => 'institution-admin', 'guard_name' => 'sanctum']);
    $user->assignRole($role);

    // Assign direct permissions for controller-level checks
    $permissions = [
        'students.view', 'students.create', 'students.edit', 'students.delete',
    ];
    $permModels = [];
    foreach ($permissions as $perm) {
        $permModels[] = Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'sanctum']);
    }
    $user->givePermissionTo($permModels);

    return $user;
}

function makeRestrictedUser(): User
{
    ensureInstitution();
    app()[PermissionRegistrar::class]->forgetCachedPermissions();

    return User::factory()->create();
}

// ── Index ────────────────────────────────────────────────────────────────────

it('lists students only from the administrators institution', function () {
    $user = makeAdminUser();
    config(['erp.institution_id' => $user->institution_id]);
    $other = Institution::create(['name' => 'Other test campus', 'code' => 'OTHER', 'slug' => 'other']);
    $local = Student::factory()->create(['institution_id' => $user->institution_id, 'status' => 'active']);
    Student::factory()->create(['institution_id' => $other->id, 'status' => 'active']);

    $this->actingAs($user, 'sanctum')->getJson('/api/students')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $local->uuid);
});

it('isolates academic documents and progress reports by role and institution', function () {
    $user = makeAdminUser();
    config(['erp.institution_id' => $user->institution_id]);
    $other = Institution::create(['name' => 'Other test campus', 'code' => 'OTHER', 'slug' => 'other']);
    $local = Student::factory()->create(['institution_id' => $user->institution_id]);
    $foreign = Student::factory()->create(['institution_id' => $other->id]);
    $this->actingAs($user, 'sanctum');

    $type = DocumentType::create(['code' => 'TEST_DOC', 'name' => 'Synthetic document', 'view_name' => 'documents.attestation_scolarite']);
    $this->postJson('/api/documents/generate', ['student_id' => $foreign->id, 'document_type_id' => $type->id])->assertNotFound();
    $this->postJson('/api/documents/generate-attestation', ['student_id' => $foreign->id, 'type' => 'scolarite'])->assertNotFound();
    $this->postJson('/api/admin/document-requests/quick-generate', ['cne_or_name' => $foreign->cne, 'document_type' => 'scolarite'])->assertNotFound();
    $this->getJson("/api/documents/download/attestation_scolarite/{$foreign->id}?v=synthetic")->assertNotFound();
    $this->getJson("/api/admin/students/{$foreign->id}/progress-report")->assertNotFound();
    $this->getJson("/api/admin/students/{$local->id}/progress-report")->assertOk()->assertJsonPath('student.id', $local->id);

    $professor = User::factory()->create(['institution_id' => $user->institution_id]);
    $professor->assignRole(Role::findOrCreate('professor', 'sanctum'));
    $this->actingAs($professor, 'sanctum');
    $this->getJson("/api/documents/download/attestation_scolarite/{$local->id}?v=synthetic")->assertForbidden();
    $this->getJson("/api/admin/students/{$local->id}/progress-report")->assertForbidden();
});

it('generates and downloads a registered official PDF for an authorized administrator', function () {
    Mail::fake();
    Notification::fake();
    Storage::fake('private');
    $user = makeAdminUser();
    $student = Student::factory()->create(['institution_id' => $user->institution_id]);
    $type = DocumentType::create(['code' => 'ATT_SCOL', 'name' => 'Attestation de scolarité', 'view_name' => 'documents.attestation_scolarite', 'is_active' => true]);
    $this->actingAs($user, 'sanctum');

    $generated = $this->postJson('/api/documents/generate', ['student_id' => $student->id, 'document_type_id' => $type->id])
        ->assertCreated()->assertJsonStructure(['data' => ['request_id', 'verification_token', 'download_url']]);
    $this->assertNotEmpty($generated->json('data.verification_token'));
    $this->get('/api/admin/document-requests/'.$generated->json('data.request_id').'/download')->assertOk()->assertDownload();
});

it('returns a list of students for authorized user', function () {
    $user = makeAdminUser();
    Student::factory()->count(3)->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/students');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data',
            'meta' => ['total', 'per_page', 'current_page', 'last_page'],
        ]);
});

it('returns 401 for unauthenticated student list', function () {
    $response = $this->getJson('/api/students');
    $response->assertStatus(401);
});

it('returns 403 for unauthorized student list', function () {
    $user = makeRestrictedUser();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/students');

    $response->assertStatus(403);
});

// ── Store ────────────────────────────────────────────────────────────────────

it('creates a student with valid data', function () {
    $user = makeAdminUser();

    $payload = [
        'first_name' => 'Amine',
        'last_name' => 'Benchekroun',
        'email' => 'amine.bench@encg-test.ma',
        'cne' => 'AB123456',
        'gender' => 'male',
        'status' => 'active',
    ];

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/students', $payload);

    $response->assertStatus(201)
        ->assertJsonPath('message', 'Étudiant créé avec succès.');
});

it('returns 422 when required fields are missing on store', function () {
    $user = makeAdminUser();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/students', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['first_name', 'last_name', 'email']);
});

it('returns 422 when email is already taken on store', function () {
    $user = makeAdminUser();
    $existingUser = User::factory()->create(['email' => 'taken@test.ma']);

    $payload = [
        'first_name' => 'Test',
        'last_name' => 'User',
        'email' => 'taken@test.ma',
        'cne' => 'XX999999',
        'gender' => 'male',
        'status' => 'active',
    ];

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/students', $payload);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

it('returns 403 when creating student without permission', function () {
    $user = makeRestrictedUser();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/students', [
            'first_name' => 'Amine',
            'last_name' => 'Test',
            'email' => 'test@test.ma',
            'cne' => 'AB999999',
            'gender' => 'male',
            'status' => 'active',
        ]);

    $response->assertStatus(403);
});

// ── Show ─────────────────────────────────────────────────────────────────────

it('shows a single student', function () {
    $user = makeAdminUser();
    $student = Student::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson("/api/students/{$student->uuid}");

    $response->assertStatus(200)
        ->assertJsonPath('data.id', $student->uuid);
});

// ── Update ───────────────────────────────────────────────────────────────────

it('updates a student with valid data', function () {
    $user = makeAdminUser();
    $student = Student::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->putJson("/api/students/{$student->uuid}", [
            'status' => 'graduated',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('message', 'Étudiant mis à jour avec succès.');
});

it('returns 422 for invalid status on update', function () {
    $user = makeAdminUser();
    $student = Student::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->putJson("/api/students/{$student->uuid}", [
            'status' => 'INVALID_STATUS',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

// ── Destroy ──────────────────────────────────────────────────────────────────

it('soft-deletes a student', function () {
    $user = makeAdminUser();
    $student = Student::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/students/{$student->uuid}");

    $response->assertStatus(200)
        ->assertJsonPath('message', 'Étudiant supprimé avec succès.');

    $this->assertSoftDeleted('students', ['id' => $student->id]);
});

it('returns 403 when deleting student without permission', function () {
    $user = makeRestrictedUser();
    $student = Student::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/students/{$student->uuid}");

    $response->assertStatus(403);
});
