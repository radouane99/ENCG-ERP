<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\CourseEvaluation;
use App\Models\EvaluationCampaign;
use App\Models\Filiere;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Semester;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentEvaluationsAndQualityBarometerTest extends TestCase
{
    use RefreshDatabase;

    private EvaluationCampaign $campaign;
    private Module $module;
    private Professor $prof;

    protected function setUp(): void
    {
        parent::setUp();

        $academicYear = $this->makeTestAcademicYear();

        $this->campaign = EvaluationCampaign::create([
            'academic_year_id' => $academicYear->id,
            'name'             => 'Baromètre Qualité Pédagogique Automne 2026',
            'semester_number'  => 1,
            'status'           => 'OPEN',
        ]);

        $filiere = $this->makeTestFiliere(['name' => 'Marketing', 'code' => 'MKT']);
        $semester = $this->makeTestSemester($academicYear->id, [
            'name'   => 'Semestre 1',
            'number' => 1,
        ]);

        $this->module = $this->makeTestModule($filiere->id, [
            'name'            => 'Comportement du Consommateur',
            'code'            => 'M105',
            'semester_number' => 1,
        ]);

        $this->prof = $this->makeTestProfessor([
            'first_name' => 'Nadia',
            'last_name'  => 'BENCHEKROUN',
            'email'      => 'n.benchekroun@encg-fes.ac.ma',
        ]);
    }

    /**
     * Test de soumission d'une évaluation de cours.
     */
    public function test_can_submit_anonymous_course_evaluation(): void
    {
        $eval = CourseEvaluation::create([
            'campaign_id'     => $this->campaign->id,
            'module_id'       => $this->module->id,
            'q1_organisation' => 5.0,
            'q2_clarte'       => 4.5,
            'q3_dispo'        => 5.0,
            'q4_utilite'      => 4.8,
            'comment'         => 'Excellente pédagogie et cas réels d\'entreprises marocaines.',
        ]);

        $this->assertDatabaseHas('course_evaluations', [
            'module_id'       => $this->module->id,
            'q1_organisation' => 5.0,
        ]);
    }
}
