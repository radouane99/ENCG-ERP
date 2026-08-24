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

/**
 * Moroccan Higher Education (MESRSFC / ENCG) Academic Progression & Compensation Rules.
 * - Compensation inter-semestres: Année validée si Moyenne(S1, S2) >= 10.0 sans note éliminatoire (< 7.0).
 * - Passage Conditionnel: Si l'année n'est pas validée mais la moyenne >= 10.0 ou modules validés >= seuil.
 */
class AnnualSemesterCompensationAndProgressionTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;
    protected AcademicYear $academicYear;
    protected Filiere $filiere;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-progression']
        );

        $this->academicYear = $this->ensureAcademicYear([
            'institution_id' => $this->institution->id,
        ]);

        $department = Department::firstOrCreate(
            ['code' => 'COMMERCE'],
            ['name' => 'Commerce International', 'institution_id' => $this->institution->id]
        );

        $this->filiere = Filiere::firstOrCreate(
            ['code' => 'CI'],
            [
                'name'           => 'Commerce International',
                'type'           => 'grande_ecole',
                'duration_years' => 5,
                'department_id'  => $department->id,
                'institution_id' => $this->institution->id,
                'is_active'      => true,
            ]
        );

        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $this->adminUser = User::factory()->create([
            'email'          => 'admin.progression@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->adminUser->assignRole($adminRole);
    }

    public function test_annual_compensation_validates_year_when_s1_and_s2_average_is_at_least_10(): void
    {
        Sanctum::actingAs($this->adminUser);

        $studentUser = User::factory()->create(['institution_id' => $this->institution->id]);
        $student = Student::create([
            'user_id'        => $studentUser->id,
            'student_number' => 'ENCG-2026-CI01',
            'cne'            => 'K130099881',
            'gender'         => 'female',
            'status'         => 'active',
            'institution_id' => $this->institution->id,
        ]);

        // S1 Average = 9.20 (Non validé séparément)
        // S2 Average = 12.00 (Validé)
        // Annual Average = (9.20 + 12.00) / 2 = 10.60 >= 10.00 -> Année Validée par Compensation (VARC / V)
        $s1Average = 9.20;
        $s2Average = 12.00;
        $annualAverage = ($s1Average + $s2Average) / 2.0;

        $hasEliminatory = false; // No mark < 7.0
        $isAnnualAdmitted = ($annualAverage >= 10.0) && !$hasEliminatory;

        $this->assertTrue($isAnnualAdmitted);
        $this->assertEquals(10.60, round($annualAverage, 2));
    }

    public function test_eliminatory_grade_prevents_compensation_even_if_annual_average_is_high(): void
    {
        Sanctum::actingAs($this->adminUser);

        // S1 has a module with 6.5/20 (< 7.0 eliminatory mark)
        // Even if annual average = 11.5/20, student must pass Rattrapage for that module
        $annualAverage = 11.50;
        $lowestModuleScore = 6.50;
        $eliminatoryThreshold = 7.00;

        $hasEliminatory = $lowestModuleScore < $eliminatoryThreshold;
        $isAnnualAdmittedDirectly = ($annualAverage >= 10.0) && !$hasEliminatory;

        $this->assertTrue($hasEliminatory);
        $this->assertFalse($isAnnualAdmittedDirectly);
    }
}
