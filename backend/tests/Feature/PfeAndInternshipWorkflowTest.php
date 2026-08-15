<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Company;
use App\Models\Filiere;
use App\Models\FinalProject;
use App\Models\Internship;
use App\Models\Professor;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PfeAndInternshipWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Student $student;
    private Professor $encadrant;
    private AcademicYear $academicYear;

    protected function setUp(): void
    {
        parent::setUp();

        $this->academicYear = $this->makeTestAcademicYear();

        $this->student = $this->makeTestStudent([
            'first_name' => 'Kenza',
            'last_name'  => 'EL ALAMI',
            'cne'        => 'N445566778',
        ]);

        $this->encadrant = $this->makeTestProfessor([
            'first_name' => 'Pr. Rachid',
            'last_name'  => 'MEZIANE',
            'email'      => 'meziane@encg-fes.ac.ma',
        ]);
    }

    /**
     * Test de soumission et validation d'une convention de stage PFE.
     */
    public function test_can_create_and_validate_internship_convention(): void
    {
        $internship = Internship::create([
            'student_id'   => $this->student->id,
            'type'         => 'fin_etudes',
            'company_name' => 'PwC Maroc (Casablanca)',
            'start_date'   => '2027-02-01',
            'end_date'     => '2027-06-30',
            'status'       => 'active',
        ]);

        $this->assertDatabaseHas('internships', [
            'student_id'   => $this->student->id,
            'company_name' => 'PwC Maroc (Casablanca)',
            'status'       => 'active',
        ]);
    }

    /**
     * Test d'encadrement et de soutenance d'un Projet de Fin d'Études (PFE).
     */
    public function test_can_manage_final_project_and_defense(): void
    {
        $pfe = FinalProject::create([
            'student_id'  => $this->student->id,
            'title'       => 'Optimisation de la structure financière des entreprises cotées au MASI',
            'description' => 'Étude empirique sur le marché boursier marocain',
            'status'      => 'defended',
        ]);

        $this->assertDatabaseHas('final_projects', [
            'student_id' => $this->student->id,
            'status'     => 'defended',
        ]);
    }
}
