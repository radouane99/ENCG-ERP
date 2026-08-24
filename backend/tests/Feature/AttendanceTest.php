<?php

declare(strict_types=1);

use App\Models\AttendanceSession;
use App\Models\Institution;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureAttendanceInstitution()
{
    Institution::firstOrCreate(
        ['id' => 1],
        ['name' => 'ENCG Test', 'code' => 'ENCG']
    );
}

function makeAttendanceAdmin(): User
{
    ensureAttendanceInstitution();
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'institution-admin', 'guard_name' => 'sanctum']);
    $user->assignRole($role);

    return $user;
}

// ── Index ────────────────────────────────────────────────────────────────────

it('returns a list of attendance sessions', function () {
    $user = makeAttendanceAdmin();
    AttendanceSession::factory()->count(2)->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/attendances')
        ->assertStatus(200)
        ->assertJsonStructure(['data', 'stats']);
});

it('returns 401 for unauthenticated attendance list', function () {
    $this->getJson('/api/attendances')->assertStatus(401);
});

it('filters attendance sessions by search query', function () {
    $user = makeAttendanceAdmin();
    AttendanceSession::factory()->create(['module_name' => 'Marketing Digital']);
    AttendanceSession::factory()->create(['module_name' => 'Finance d\'Entreprise']);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/attendances?search=Marketing');

    $response->assertStatus(200);
    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['module_name'])->toBe('Marketing Digital');
});

it('returns correct stats totals', function () {
    $user = makeAttendanceAdmin();
    AttendanceSession::factory()->count(2)->create(['status' => 'active']);
    AttendanceSession::factory()->count(1)->closed()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/attendances');

    $response->assertStatus(200);
    expect($response->json('stats.total_sessions'))->toBe(3);
    expect($response->json('stats.active_sessions'))->toBe(2);
});

// ── Destroy ──────────────────────────────────────────────────────────────────

it('deletes an attendance session', function () {
    $user = makeAttendanceAdmin();
    $session = AttendanceSession::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/attendances/{$session->id}")
        ->assertStatus(200)
        ->assertJsonPath('success', true);
});

it('returns 404 when deleting non-existent session', function () {
    $user = makeAttendanceAdmin();

    $this->actingAs($user, 'sanctum')
        ->deleteJson('/api/attendances/99999')
        ->assertStatus(404);
});
