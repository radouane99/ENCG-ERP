<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Department;
use App\Models\Group;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FiliereModuleStructureTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private AcademicYear $academicYear;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $this->academicYear = $this->makeTestAcademicYear();
    }

    /**
     * Test de création d'une filière avec ses départements de rattachement.
     */
    public function test_can_create_filiere_and_department(): void
    {
        $department = Department::create([
            'institution_id' => 1,
            'name' => 'Département Gestion Financière & Comptable',
            'code' => 'GFC',
        ]);

        $filiere = $this->makeTestFiliere([
            'name' => 'Audit et Contrôle de Gestion',
            'code' => 'ACG',
            'department_id' => $department->id,
            'duration_years' => 5,
        ]);

        $this->assertDatabaseHas('filieres', [
            'code' => 'ACG',
            'name' => 'Audit et Contrôle de Gestion',
        ]);
        $this->assertEquals('GFC', $filiere->department->code);
    }

    /**
     * Test de la structure semestrielle ENCG (S1 à S10).
     */
    public function test_can_scaffold_semesters_s1_to_s10(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $this->makeTestSemester($this->academicYear->id, [
                'name' => "Semestre {$i}",
                'number' => $i,
            ]);
        }

        $this->assertCount(10, Semester::where('academic_year_id', $this->academicYear->id)->get());
    }

    /**
     * Test de création des modules avec coefficients et éléments constitutifs.
     */
    public function test_can_create_module_with_elements_and_credits(): void
    {
        $filiere = $this->makeTestFiliere(['name' => 'Management', 'code' => 'MGT']);
        $semester = $this->makeTestSemester($this->academicYear->id, [
            'name' => 'Semestre 1',
            'number' => 1,
        ]);

        $module = $this->makeTestModule($filiere->id, [
            'name' => 'Comptabilité Générale I',
            'code' => 'M101',
            'semester_number' => 1,
            'credit_hours' => 48,
        ]);

        $this->assertDatabaseHas('modules', [
            'code' => 'M101',
            'name' => 'Comptabilité Générale I',
        ]);
        $this->assertEquals(48, $module->credit_hours);
    }

    /**
     * Test de création des groupes pédagogiques de TD/TP par filière.
     */
    public function test_can_create_groups_per_semester_and_filiere(): void
    {
        $filiere = $this->makeTestFiliere(['name' => 'Tronc Commun', 'code' => 'TC']);

        $group1 = Group::create([
            'academic_year_id' => $this->academicYear->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 1,
            'name' => 'Groupe 1 (S1)',
            'capacity' => 60,
        ]);

        $group2 = Group::create([
            'academic_year_id' => $this->academicYear->id,
            'filiere_id' => $filiere->id,
            'semester_number' => 1,
            'name' => 'Groupe 2 (S1)',
            'capacity' => 60,
        ]);

        $this->assertDatabaseHas('groups', ['name' => 'Groupe 1 (S1)']);
        $this->assertDatabaseHas('groups', ['name' => 'Groupe 2 (S1)']);
    }
}
