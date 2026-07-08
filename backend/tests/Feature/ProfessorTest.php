<?php

declare(strict_types=1);

use App\Models\Professor;
use App\Models\User;
use Spatie\Permission\Models\Permission;

// ── Helpers ─────────────────────────────────────────────────────────────────

function ensureProfInstitution()
{
    \App\Models\Institution::firstOrCreate(
        ['id' => 1],
        ['name' => 'ENCG Test', 'code' => 'ENCG']
    );
}

function makeProfAdmin(): User
{
    ensureProfInstitution();
    $user = User::factory()->create();
    $permModels = [];
    foreach (['professors.view', 'professors.create', 'professors.edit', 'professors.delete'] as $perm) {
        $permModels[] = Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'sanctum']);
    }
    $user->givePermissionTo($permModels);
    return $user;
}

function makeProfRestricted(): User
{
    ensureProfInstitution();
    return User::factory()->create();
}

// ── Index ────────────────────────────────────────────────────────────────────

it('returns a list of professors for authorized user', function () {
    $user = makeProfAdmin();
    Professor::factory()->count(3)->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/professors');

    $response->assertStatus(200)
        ->assertJsonStructure(['data']);
});

it('returns 401 for unauthenticated professor list', function () {
    $this->getJson('/api/professors')->assertStatus(401);
});

it('returns 403 for unauthorized professor list', function () {
    $user = makeProfRestricted();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/professors')
        ->assertStatus(403);
});

// ── Store ────────────────────────────────────────────────────────────────────

it('creates a professor with valid data', function () {
    $user = makeProfAdmin();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/professors', [
            'first_name'    => 'Mohamed',
            'last_name'     => 'Alami',
            'email'         => 'prof.alami@encg-test.ma',
            'contract_type' => 'permanent',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('message', 'Professeur créé avec succès.');
});

it('returns 422 when required fields are missing for professor', function () {
    $user = makeProfAdmin();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/professors', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'contract_type']);
});

it('returns 422 when email is already taken for professor', function () {
    $user = makeProfAdmin();
    User::factory()->create(['email' => 'taken.prof@test.ma']);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/professors', [
            'first_name'    => 'Karim',
            'last_name'     => 'Benali',
            'email'         => 'taken.prof@test.ma',
            'contract_type' => 'contractual',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

it('returns 422 for invalid contract_type', function () {
    $user = makeProfAdmin();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/professors', [
            'first_name'    => 'Test',
            'last_name'     => 'Prof',
            'email'         => 'testprof@encg-test.ma',
            'contract_type' => 'INVALID_TYPE',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['contract_type']);
});

it('returns 403 when creating professor without permission', function () {
    $user = makeProfRestricted();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/professors', [
            'first_name'    => 'Amine',
            'last_name'     => 'Test',
            'email'         => 'test@test.ma',
            'contract_type' => 'permanent',
        ])
        ->assertStatus(403);
});

// ── Show ─────────────────────────────────────────────────────────────────────

it('shows a single professor', function () {
    $user = makeProfAdmin();
    $professor = Professor::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/professors/{$professor->id}")
        ->assertStatus(200)
        ->assertJsonPath('data.id', $professor->id);
});

// ── Update ───────────────────────────────────────────────────────────────────

it('updates a professor with valid data', function () {
    $user = makeProfAdmin();
    $professor = Professor::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/professors/{$professor->id}", [
            'grade' => 'Professeur Habilité',
        ])
        ->assertStatus(200)
        ->assertJsonPath('message', 'Professeur mis à jour avec succès.');
});

it('returns 422 for invalid contract_type on update', function () {
    $user = makeProfAdmin();
    $professor = Professor::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/professors/{$professor->id}", [
            'contract_type' => 'BAD_VALUE',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['contract_type']);
});

// ── Destroy ──────────────────────────────────────────────────────────────────

it('soft-deletes a professor', function () {
    $user = makeProfAdmin();
    $professor = Professor::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/professors/{$professor->id}")
        ->assertStatus(200)
        ->assertJsonPath('message', 'Professeur supprimé avec succès.');

    $this->assertSoftDeleted('professors', ['id' => $professor->id]);
});

it('returns 403 when deleting professor without permission', function () {
    $user = makeProfRestricted();
    $professor = Professor::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/professors/{$professor->id}")
        ->assertStatus(403);
});
