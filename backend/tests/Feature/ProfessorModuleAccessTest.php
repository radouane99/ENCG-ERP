<?php

declare(strict_types=1);

use App\Models\AcademicYear;
use App\Models\Module;
use App\Models\Professor;
use App\Models\User;
use App\Services\Academic\GradeService;
use App\Services\Security\ProfessorAccessService;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

/*
| Régression : l'accès d'un professeur à un module doit reposer UNIQUEMENT
| sur la liaison users.id → professors.user_id → module_professor.
| Avant correctif, le code ajoutait $user->id et l'ID codé en dur 1 à la liste
| des professor_id autorisés, ce qui exposait les modules d'autres enseignants.
*/

function assignModuleToProfessor(Module $module, Professor $prof): void
{
    DB::table('module_professor')->insert([
        'module_id' => $module->id,
        'academic_year_id' => AcademicYear::firstOrCreate(
            ['start_year' => 2025, 'end_year' => 2026],
            ['institution_id' => 1, 'label' => '2025/2026']
        )->id,
        'professor_id' => $prof->id,
        'professor_type' => Professor::class,
        'session_type' => 'cm',
        'assigned_hours' => 0,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function professorUser(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::firstOrCreate(['name' => 'professor', 'guard_name' => 'sanctum']));

    return $user;
}

it('grants a professor access only to modules assigned to him', function () {
    $userA = professorUser();
    $profA = Professor::factory()->create(['user_id' => $userA->id]);
    $profB = Professor::factory()->create();

    $ownModule = Module::factory()->create();
    $foreignModule = Module::factory()->create();
    assignModuleToProfessor($ownModule, $profA);
    assignModuleToProfessor($foreignModule, $profB);

    $ids = app(ProfessorAccessService::class)->getAuthorizedModuleIds($userA);

    expect($ids->all())->toContain($ownModule->id)
        ->and($ids->all())->not->toContain($foreignModule->id);
});

it('does not treat the user id as a professor id', function () {
    $userA = professorUser();
    // Professeur B dont l'ID de profil est égal à l'ID utilisateur de A.
    $profB = Professor::factory()->create(['id' => $userA->id]);
    Professor::factory()->create(['user_id' => $userA->id]);

    $moduleOfB = Module::factory()->create();
    assignModuleToProfessor($moduleOfB, $profB);

    expect(app(ProfessorAccessService::class)->getAuthorizedModuleIds($userA)->all())
        ->not->toContain($moduleOfB->id)
        ->and(app(GradeService::class)->isProfessorAssignedToModule($userA->id, $moduleOfB->id))
        ->toBeFalse();
});

it('does not leak the modules of professor #1', function () {
    $profOne = Professor::factory()->create(['id' => 1]);
    $moduleOfOne = Module::factory()->create();
    assignModuleToProfessor($moduleOfOne, $profOne);

    $userA = professorUser();
    Professor::factory()->create(['user_id' => $userA->id]);

    expect(app(ProfessorAccessService::class)->getAuthorizedModuleIds($userA)->all())
        ->not->toContain($moduleOfOne->id)
        ->and(app(GradeService::class)->isProfessorAssignedToModule($userA->id, $moduleOfOne->id))
        ->toBeFalse();
});

it('gives no module access to a user without a professor profile', function () {
    $prof = Professor::factory()->create();
    $module = Module::factory()->create();
    assignModuleToProfessor($module, $prof);

    $orphan = professorUser();

    expect(app(ProfessorAccessService::class)->getAuthorizedModuleIds($orphan))->toBeEmpty()
        ->and(app(GradeService::class)->isProfessorAssignedToModule($orphan->id, $module->id))->toBeFalse();
});

it('confirms assignment for the assigned professor', function () {
    $user = professorUser();
    $prof = Professor::factory()->create(['user_id' => $user->id]);
    $module = Module::factory()->create();
    assignModuleToProfessor($module, $prof);

    expect(app(GradeService::class)->isProfessorAssignedToModule($user->id, $module->id))->toBeTrue();
});
