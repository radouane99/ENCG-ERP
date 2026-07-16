<?php

declare(strict_types=1);

use App\Models\Student;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

// ── Helpers ─────────────────────────────────────────────────────────────────

function ensureInstitution()
{
    \App\Models\Institution::firstOrCreate(
        ['id' => 1],
        ['name' => 'ENCG Test', 'code' => 'ENCG']
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
        'first_name'    => 'Amine',
        'last_name'     => 'Benchekroun',
        'email'         => 'amine.bench@encg-test.ma',
        'cne'           => 'AB123456',
        'gender'        => 'male',
        'status'        => 'active',
    ];

    $this->withoutExceptionHandling();
    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/students', $payload);

    $response->dump();
    $response->assertStatus(201)
        ->assertJsonPath('message', 'Étudiant créé avec succès.');
});

it('returns 422 when required fields are missing on store', function () {
    $user = makeAdminUser();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/students', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'cne', 'gender', 'status']);
});

it('returns 422 when email is already taken on store', function () {
    $user = makeAdminUser();
    $existingUser = User::factory()->create(['email' => 'taken@test.ma']);

    $payload = [
        'first_name' => 'Test',
        'last_name'  => 'User',
        'email'      => 'taken@test.ma',
        'cne'        => 'XX999999',
        'gender'     => 'male',
        'status'     => 'active',
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
            'last_name'  => 'Test',
            'email'      => 'test@test.ma',
            'cne'        => 'AB999999',
            'gender'     => 'male',
            'status'     => 'active',
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
