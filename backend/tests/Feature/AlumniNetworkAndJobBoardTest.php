<?php

namespace Tests\Feature;

use App\Models\AcademicProject;
use App\Models\JobOffer;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlumniNetworkAndJobBoardTest extends TestCase
{
    use RefreshDatabase;

    private User $alumniUser;
    private Student $student;
    private \App\Models\AcademicYear $academicYear;

    protected function setUp(): void
    {
        parent::setUp();

        $this->academicYear = $this->makeTestAcademicYear();
        $this->student = $this->makeTestStudent([
            'first_name' => 'Soufiane',
            'last_name'  => 'EL AMRANI',
            'cne'        => 'N123443211',
            'status'     => 'graduated',
        ]);
        $this->alumniUser = $this->student->user;
    }

    /**
     * Test de publication du profil lauréat et insertion professionnelle.
     */
    public function test_can_create_alumni_profile_and_career_record(): void
    {
        $project = AcademicProject::create([
            'institution_id'   => 1,
            'academic_year_id' => $this->academicYear->id,
            'student_id'       => $this->student->id,
            'type'             => 'alumni_survey',
            'title'            => 'Senior Auditor',
            'company_name'     => 'Deloitte Morocco (Casablanca)',
            'position_title'   => 'Senior Auditor',
            'status'           => 'employed',
            'description'      => 'Graduation: 2025 | Sector: Audit & Conseil | Salary: 14500.00',
        ]);

        $this->assertDatabaseHas('academic_projects', [
            'student_id'   => $this->student->id,
            'company_name' => 'Deloitte Morocco (Casablanca)',
            'type'         => 'alumni_survey',
            'status'       => 'employed',
        ]);
    }

    /**
     * Test de publication d'une offre d'emploi / stage pour la communauté ENCG.
     */
    public function test_can_publish_exclusive_job_offer(): void
    {
        $offer = JobOffer::create([
            'title'    => 'Financial Analyst M&A',
            'company'  => 'BMCE Capital',
            'location' => 'Casablanca Finance City',
            'type'     => 'CDI',
            'status'   => 'NEW',
        ]);

        $this->assertDatabaseHas('job_offers', [
            'company' => 'BMCE Capital',
            'type'    => 'CDI',
            'status'  => 'NEW',
        ]);
    }
}
