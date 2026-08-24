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

class ConcurrentGradeSubmissionAndLockingTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;

    protected Assessment $assessment;

    protected Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-concurrency']
        );

        $filiere = Filiere::firstOrCreate(
            ['code' => 'AUDIT'],
            [
                'name' => 'Audit et Contrôle de Gestion',
                'type' => 'grande_ecole',
                'duration_years' => 5,
                'institution_id' => $this->institution->id,
                'is_active' => true,
            ]
        );

        $module = Module::firstOrCreate(
            ['code' => 'AUD101', 'filiere_id' => $filiere->id],
            [
                'name' => 'Normes d\'Audit Internationales',
                'semester_number' => 7,
                'coefficient' => 1.00,
                'credit_hours' => 45,
                'institution_id' => $this->institution->id,
                'is_active' => true,
            ]
        );

        $this->assessment = Assessment::create([
            'module_id' => $module->id,
            'type' => 'Exam',
            'weight' => 60.00,
            'date' => '2027-01-15',
        ]);

        $studentUser = User::factory()->create(['institution_id' => $this->institution->id]);
        $this->student = Student::create([
            'user_id' => $studentUser->id,
            'student_number' => 'ENCG-2026-AUD01',
            'cne' => 'A139988776',
            'gender' => 'male',
            'status' => 'active',
            'institution_id' => $this->institution->id,
        ]);
    }

    public function test_grade_has_initial_version_for_optimistic_locking(): void
    {
        $grade = Grade::create([
            'student_id' => $this->student->id,
            'assessment_id' => $this->assessment->id,
            'value' => 15.50,
            'absent' => false,
            'version' => 1,
        ]);

        $this->assertEquals(1, $grade->version);
        $this->assertEquals(15.50, (float) $grade->value);
    }

    public function test_grade_version_increments_on_modification(): void
    {
        $grade = Grade::create([
            'student_id' => $this->student->id,
            'assessment_id' => $this->assessment->id,
            'value' => 12.00,
            'absent' => false,
            'version' => 1,
        ]);

        $grade->update([
            'value' => 14.50,
            'version' => $grade->version + 1,
        ]);

        $this->assertEquals(2, $grade->fresh()->version);
        $this->assertEquals(14.50, (float) $grade->fresh()->value);
    }
}
