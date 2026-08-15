<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfessorAndAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private AcademicYear $academicYear;
    private Filiere $filiere;
    private Module $module;
    private Group $group;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $this->academicYear = $this->makeTestAcademicYear();
        $this->filiere = $this->makeTestFiliere(['name' => 'Finance', 'code' => 'FIN']);
        $semester = $this->makeTestSemester($this->academicYear->id, [
            'name'   => 'Semestre 3',
            'number' => 3,
        ]);

        $this->module = $this->makeTestModule($this->filiere->id, [
            'name'            => 'Finance d\'Entreprise',
            'code'            => 'M301',
            'semester_number' => 3,
            'credit_hours'    => 48,
        ]);

        $this->group = Group::create([
            'academic_year_id' => $this->academicYear->id,
            'filiere_id'       => $this->filiere->id,
            'semester_number'  => 3,
            'name'             => 'Groupe 1 (S3)',
            'capacity'         => 60,
        ]);
    }

    /**
     * Test de création d'un professeur permanent et d'un vacataire.
     */
    public function test_can_create_permanent_and_vacataire_professors(): void
    {
        $prof1 = $this->makeTestProfessor([
            'first_name' => 'Karim',
            'last_name'  => 'EL AMRANI',
            'grade'      => 'PES',
            'contract_type' => 'permanent',
        ]);

        $prof2 = $this->makeTestProfessor([
            'first_name' => 'Mehdi',
            'last_name'  => 'BENNANI',
            'grade'      => 'Vacataire',
            'contract_type' => 'visiting',
        ]);

        $this->assertDatabaseHas('professors', ['id' => $prof1->id, 'contract_type' => 'permanent']);
        $this->assertDatabaseHas('professors', ['id' => $prof2->id, 'contract_type' => 'visiting']);
    }

    /**
     * Test d'affectation d'un module et groupe à un professeur.
     */
    public function test_can_assign_module_and_group_to_professor(): void
    {
        $prof = $this->makeTestProfessor([
            'first_name' => 'Hassan',
            'last_name'  => 'BENJELLOUN',
        ]);

        \Illuminate\Support\Facades\DB::table('module_professor')->insert([
            'professor_id'     => $prof->id,
            'professor_type'   => \App\Models\Professor::class,
            'module_id'        => $this->module->id,
            'group_id'         => $this->group->id,
            'academic_year_id' => $this->academicYear->id,
            'session_type'     => 'cm',
            'assigned_hours'   => 48,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $this->assertDatabaseHas('module_professor', [
            'professor_id' => $prof->id,
            'module_id'    => $this->module->id,
            'group_id'     => $this->group->id,
        ]);
    }
}
