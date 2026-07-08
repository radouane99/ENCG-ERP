<?php

declare(strict_types=1);

use App\Models\Internship;
use App\Models\Professor;
use App\Models\User;
use Spatie\Permission\Models\Permission;

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeInternshipAdmin(): User
{
    $user = User::factory()->create();
    foreach (['internships.view', 'internships.edit'] as $perm) {
        Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'sanctum']);
    }
    $user->givePermissionTo(['internships.view', 'internships.edit']);
    return $user;
}

// ── Index ────────────────────────────────────────────────────────────────────

it('returns a list of internships for authorized user', function () {
    $user = makeInternshipAdmin();
    Internship::factory()->count(3)->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/internships')
        ->assertStatus(200)
        ->assertJsonStructure(['success', 'data']);
});

it('returns 401 for unauthenticated internship list', function () {
    $this->getJson('/api/internships')->assertStatus(401);
});

it('returns 403 for unauthorized internship list', function () {
    $user = User::factory()->create(); // No permissions

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/internships')
        ->assertStatus(403);
});

// ── Update: Validate action ──────────────────────────────────────────────────

it('validates an internship with action=validate', function () {
    $user = makeInternshipAdmin();
    $internship = Internship::factory()->pending()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/internships/{$internship->id}", [
            'action' => 'validate',
        ])
        ->assertStatus(200)
        ->assertJsonPath('success', true);
});

it('assigns a supervisor to an internship', function () {
    $user = makeInternshipAdmin();
    $internship = Internship::factory()->pending()->create();
    $professor = Professor::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/internships/{$internship->id}", [
            'action'        => 'assign_supervisor',
            'supervisor_id' => $professor->id,
        ])
        ->assertStatus(200)
        ->assertJsonPath('success', true);
});

// ── Update: Validation errors ────────────────────────────────────────────────

it('returns 422 when action is missing on internship update', function () {
    $user = makeInternshipAdmin();
    $internship = Internship::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/internships/{$internship->id}", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['action']);
});

it('returns 422 when action is invalid', function () {
    $user = makeInternshipAdmin();
    $internship = Internship::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/internships/{$internship->id}", [
            'action' => 'INVALID_ACTION',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['action']);
});

it('returns 422 when supervisor_id is missing for assign_supervisor action', function () {
    $user = makeInternshipAdmin();
    $internship = Internship::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/internships/{$internship->id}", [
            'action' => 'assign_supervisor',
            // supervisor_id missing
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['supervisor_id']);
});

it('returns 422 when supervisor_id does not exist in professors table', function () {
    $user = makeInternshipAdmin();
    $internship = Internship::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/internships/{$internship->id}", [
            'action'        => 'assign_supervisor',
            'supervisor_id' => 999999,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['supervisor_id']);
});
