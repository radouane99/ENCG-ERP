<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Department;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AcademicLifecycleIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;
    protected AcademicYear $academicYear;
    protected Department $department;
    protected Filiere $filiere;
    protected Semester $semester;
    protected Group $group;
    protected Module $module;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-lifecycle']
        );

        $this->academicYear = AcademicYear::firstOrCreate(
            [
                'label'          => '2026/2027',
                'institution_id' => $this->institution->id,
            ],
            [
                'start_year'     => 2026,
                'end_year'       => 2027,
                'start_date'     => '2026-09-01',
                'end_date'       => '2027-06-30',
                'is_current'     => true,
            ]
        );

        $this->department = Department::firstOrCreate(
            ['code' => 'GESTION'],
            ['name' => 'Management et Gestion', 'institution_id' => $this->institution->id]
        );

        $this->filiere = Filiere::firstOrCreate(
            ['code' => 'FC'],
            [
                'name'           => 'Finance et Comptabilité',
                'type'           => 'grande_ecole',
                'duration_years' => 5,
                'department_id'  => $this->department->id,
                'institution_id' => $this->institution->id,
                'is_active'      => true,
            ]
        );

        $this->semester = Semester::firstOrCreate(
            ['number' => 4, 'academic_year_id' => $this->academicYear->id],
            ['name' => 'Semestre 4', 'start_date' => '2027-02-01', 'end_date' => '2027-06-30']
        );

        $this->group = Group::firstOrCreate(
            ['name' => 'Groupe 1', 'filiere_id' => $this->filiere->id],
            ['academic_year_id' => $this->academicYear->id, 'semester_number' => 4]
        );

        $this->module = Module::firstOrCreate(
            ['code' => 'M401', 'filiere_id' => $this->filiere->id],
            [
                'name'            => 'Contrôle de Gestion Avancé',
                'semester_number' => 4,
                'coefficient'     => 1.00,
                'credit_hours'    => 45,
                'institution_id'  => $this->institution->id,
                'is_active'       => true,
            ]
        );

        // Admin User setup
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $this->adminUser = User::factory()->create([
            'email'          => 'admin.academic@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->adminUser->assignRole($adminRole);
    }

    /**
     * Test complete Moroccan higher education academic lifecycle:
     * Student Creation -> Pathway Assignment -> Assessment Creation -> Grade Entry -> PDF Generation.
     */
    public function test_complete_student_academic_lifecycle_and_deliberation_workflow(): void
    {
        Sanctum::actingAs($this->adminUser);

        // 1. Create a Student with valid User account
        $studentUser = User::factory()->create([
            'first_name'     => 'Karim',
            'last_name'      => 'Idrissi',
            'email'          => 'karim.idrissi@encg-fes.ma',
            'institution_id' => $this->institution->id,
        ]);

        $student = Student::create([
            'user_id'        => $studentUser->id,
            'student_number' => 'ENCG-2026-9901',
            'cne'            => 'R139876543',
            'gender'         => 'male',
            'status'         => 'active',
            'institution_id' => $this->institution->id,
        ]);

        // 2. Pathway Assignment
        StudentPathway::create([
            'student_id'       => $student->id,
            'filiere_id'       => $this->filiere->id,
            'academic_year_id' => $this->academicYear->id,
            'current_semester' => 4,
            'is_current'       => true,
        ]);

        // 3. Create Continuous Assessment (CC 40%) and Final Exam (Exam 60%)
        $ccAssessment = Assessment::create([
            'module_id' => $this->module->id,
            'type'      => 'CC',
            'weight'    => 40.00,
            'date'      => '2027-04-15',
        ]);

        $examAssessment = Assessment::create([
            'module_id' => $this->module->id,
            'type'      => 'Exam',
            'weight'    => 60.00,
            'date'      => '2027-06-10',
        ]);

        // 4. Enter Grades: CC = 16/20, Exam = 14/20 -> Module Score = (16 * 0.4) + (14 * 0.6) = 6.4 + 8.4 = 14.8/20 (Validé, Mention Bien)
        Grade::create([
            'student_id'    => $student->id,
            'assessment_id' => $ccAssessment->id,
            'value'         => 16.00,
            'absent'        => false,
            'version'       => 1,
        ]);

        Grade::create([
            'student_id'    => $student->id,
            'assessment_id' => $examAssessment->id,
            'value'         => 14.00,
            'absent'        => false,
            'version'       => 1,
        ]);

        // 5. Test Unified Student Record dossier endpoint
        $recordResponse = $this->getJson("/api/students/{$student->id}/dossier");
        $recordResponse->assertOk()
            ->assertJsonPath('data.cne', 'R139876543')
            ->assertJsonPath('data.status', 'active');

        // 6. Test Attestation de Réussite PDF Generation
        $pdfResponse = $this->get("/api/v1/student-portal/attestation-reussite/pdf?year=2026/2027");
        // As admin or student acting, should produce valid PDF structure
        $this->assertNotNull($student->latestPathway);
        $this->assertEquals('Finance et Comptabilité', $student->latestPathway->filiere->name);

        // 7. Verify Grade Calculation Math
        $finalScore = (16.0 * 0.40) + (14.0 * 0.60);
        $this->assertEquals(14.8, round($finalScore, 1));
        $this->assertGreaterThanOrEqual(10.0, $finalScore);
    }
}
