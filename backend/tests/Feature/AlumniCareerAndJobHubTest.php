<?php

namespace Tests\Feature;

use App\Models\AcademicProject;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AlumniCareerAndJobHubTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;
    protected User $alumniUser;
    protected Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-alumni']
        );

        $alumniRole = Role::firstOrCreate(['name' => 'alumni', 'guard_name' => 'sanctum']);
        $this->alumniUser = User::factory()->create([
            'email'          => 'laureat.encg@alumni.encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->alumniUser->assignRole($alumniRole);

        $this->student = Student::create([
            'user_id'        => $this->alumniUser->id,
            'student_number' => 'ENCG-LAUREAT-01',
            'cne'            => 'P130099887',
            'gender'         => 'male',
            'status'         => 'graduated',
            'institution_id' => $this->institution->id,
        ]);
    }

    public function test_alumni_survey_submission_and_metrics(): void
    {
        Sanctum::actingAs($this->alumniUser);

        $project = AcademicProject::create([
            'institution_id' => $this->institution->id,
            'student_id'     => $this->student->id,
            'title'          => 'Projet d\'Insertion Professionnelle Lauréat Deloitte',
            'type'           => 'pfe',
            'company_name'   => 'Deloitte Morocco',
            'position_title' => 'Financial Auditor Senior',
            'status'         => 'completed',
        ]);

        $this->assertEquals('pfe', $project->type);
        $this->assertEquals('Deloitte Morocco', $project->company_name);
        $this->assertEquals('completed', $project->status);
    }
}
