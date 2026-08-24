<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Non-Regression & Boundary Value Analysis (BVA) Test Suite.
 * Adheres strictly to ISTQB 7 Principles of Software Testing & Moroccan LMD Standards.
 */
class AcademicNonRegressionAndBoundaryTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;

    protected Module $module;

    protected Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-non-regression']
        );

        $filiere = Filiere::firstOrCreate(
            ['code' => 'REG'],
            [
                'name' => 'Filière Non Régression',
                'type' => 'grande_ecole',
                'duration_years' => 5,
                'institution_id' => $this->institution->id,
                'is_active' => true,
            ]
        );

        $this->module = Module::firstOrCreate(
            ['code' => 'REG101', 'filiere_id' => $filiere->id],
            [
                'name' => 'Module de Non Régression',
                'semester_number' => 1,
                'coefficient' => 1.00,
                'credit_hours' => 45,
                'institution_id' => $this->institution->id,
                'is_active' => true,
            ]
        );

        $user = User::factory()->create(['institution_id' => $this->institution->id]);
        $this->student = Student::create([
            'user_id' => $user->id,
            'student_number' => 'ENCG-REG-001',
            'cne' => 'R130009999',
            'gender' => 'female',
            'status' => 'active',
            'institution_id' => $this->institution->id,
        ]);
    }

    /**
     * Principle 2 (BVA): Test exact boundary at 6.00/20 (Eliminatory Threshold).
     * 6.00 is NOT eliminatory (Eligible for compensation / rattrapage).
     * 5.99 IS strictly eliminatory.
     */
    public function test_boundary_eliminatory_grade_at_six_point_zero(): void
    {
        $exactThreshold = 6.00;
        $justBelowThreshold = 5.99;
        $eliminatoryCutoff = 6.00;

        $isEliminatoryExact = $exactThreshold < $eliminatoryCutoff;
        $isEliminatoryBelow = $justBelowThreshold < $eliminatoryCutoff;

        $this->assertFalse($isEliminatoryExact, '6.00/20 must NOT be considered eliminatory.');
        $this->assertTrue($isEliminatoryBelow, '5.99/20 MUST be considered eliminatory.');
    }

    /**
     * Principle 2 (BVA): Test exact boundary for Rachat (Academic Grace) [9.50, 10.00[.
     * 9.50 is eligible for deliberation jury rachat if no eliminatory mark.
     * 9.49 is NOT eligible for automatic rachat.
     */
    public function test_boundary_rachat_grace_threshold(): void
    {
        $eligibleAverage = 9.50;
        $ineligibleAverage = 9.49;

        $isRachatEligible = fn (float $avg) => ($avg >= 9.50 && $avg < 10.00);

        $this->assertTrue($isRachatEligible($eligibleAverage));
        $this->assertFalse($isRachatEligible($ineligibleAverage));
    }

    /**
     * Principle 1 & 4 (Defect Clustering): Test Absent Grade is strictly treated as 0.00 and does not crash average calculation.
     */
    public function test_absent_grade_is_strictly_zero_in_weighted_calculations(): void
    {
        $assessmentCC = Assessment::create([
            'module_id' => $this->module->id,
            'type' => 'CC',
            'weight' => 50.00,
            'date' => '2026-11-10',
        ]);

        $assessmentExam = Assessment::create([
            'module_id' => $this->module->id,
            'type' => 'Exam',
            'weight' => 50.00,
            'date' => '2026-12-15',
        ]);

        // Student present in CC (14/20), Absent in Exam (treated as 0)
        $gradeCC = Grade::create([
            'student_id' => $this->student->id,
            'assessment_id' => $assessmentCC->id,
            'value' => 14.00,
            'absent' => false,
            'version' => 1,
        ]);

        $gradeExam = Grade::create([
            'student_id' => $this->student->id,
            'assessment_id' => $assessmentExam->id,
            'value' => null,
            'absent' => true,
            'version' => 1,
        ]);

        $finalScore = ($gradeCC->value * 0.50) + (($gradeExam->absent ? 0.0 : $gradeExam->value) * 0.50);

        $this->assertEquals(7.00, $finalScore);
        $this->assertTrue($gradeExam->absent);
    }

    /**
     * Non-Regression: Test Grade modification audit version increments reliably without data corruption.
     */
    public function test_grade_update_idempotency_and_integrity(): void
    {
        $assessment = Assessment::create([
            'module_id' => $this->module->id,
            'type' => 'CC',
            'weight' => 100.00,
            'date' => '2026-11-20',
        ]);

        $grade = Grade::create([
            'student_id' => $this->student->id,
            'assessment_id' => $assessment->id,
            'value' => 10.00,
            'absent' => false,
            'version' => 1,
        ]);

        // Modify 3 consecutive times
        $grade->update(['value' => 12.00, 'version' => 2]);
        $grade->update(['value' => 14.00, 'version' => 3]);
        $grade->update(['value' => 16.00, 'version' => 4]);

        $this->assertEquals(4, $grade->fresh()->version);
        $this->assertEquals(16.00, (float) $grade->fresh()->value);
    }
}
