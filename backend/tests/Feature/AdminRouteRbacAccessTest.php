<?php

declare(strict_types=1);

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Institution;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

/*
| Tests de non-régression RBAC :
| Vérifie qu'un vacataire ou rôle non-admin reçoit systématiquement un HTTP 403
| sur les opérations sensibles (paramètres institutionnels, export APOGEE,
| découpage des groupes, rachat de délibération, suppression de groupe).
*/

function createRoleUser(string $roleName): User
{
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'sanctum']);
    $user->assignRole($role);

    return $user;
}

beforeEach(function () {
    Institution::firstOrCreate(
        ['slug' => 'encg-fes'],
        [
            'name' => 'ENCG Fès',
            'code' => 'ENCG-FES',
            'type' => 'grande_ecole',
        ]
    );
});

it('forbids a vacataire from viewing or updating institution settings', function () {
    $vacataire = createRoleUser('vacataire');
    Sanctum::actingAs($vacataire, ['*']);

    $this->getJson('/api/admin/institution-settings')->assertStatus(403);
    $this->postJson('/api/admin/institution-settings', ['institutionName' => 'Hacked'])->assertStatus(403);
});

it('forbids a vacataire from exporting APOGEE CSV data', function () {
    $vacataire = createRoleUser('vacataire');
    Sanctum::actingAs($vacataire, ['*']);

    $this->getJson('/api/apogee/export-csv')->assertStatus(403);
    $this->getJson('/api/apogee/preview')->assertStatus(403);
});

it('forbids a vacataire from dispatching students or subgroups', function () {
    $vacataire = createRoleUser('vacataire');
    Sanctum::actingAs($vacataire, ['*']);

    $this->postJson('/api/groups/dispatch-students', ['filiere_id' => 1])->assertStatus(403);
    $this->postJson('/api/groups/dispatch-subgroups', ['group_id' => 1])->assertStatus(403);
});

it('forbids a vacataire from deleting an academic group', function () {
    $vacataire = createRoleUser('vacataire');
    $filiere = Filiere::factory()->create();
    $year = AcademicYear::factory()->create();
    $group = Group::create([
        'name' => 'Groupe Test RBAC',
        'filiere_id' => $filiere->id,
        'academic_year_id' => $year->id,
        'semester_number' => 1,
        'capacity' => 30,
    ]);
    Sanctum::actingAs($vacataire, ['*']);

    $this->deleteJson("/api/groups/{$group->id}")->assertStatus(403);
});

it('forbids a vacataire from applying deliberation rachat', function () {
    $vacataire = createRoleUser('vacataire');
    Sanctum::actingAs($vacataire, ['*']);

    $this->postJson('/api/deliberations/apply-rachat', [
        'student_id' => 1,
        'points_added' => 1.5,
    ])->assertStatus(403);
});

it('allows a super-admin to access institution settings', function () {
    $admin = createRoleUser('super-admin');
    Sanctum::actingAs($admin, ['*']);

    $response = $this->getJson('/api/admin/institution-settings');
    $response->assertOk();
    $response->assertJsonPath('success', true);
});
