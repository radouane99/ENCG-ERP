<?php

namespace Tests\Feature;

use App\Services\Academic\ApogeeDeliberationEngine;
use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\User;
use App\Services\Academic\AcademicYearRolloverService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicYearRolloverAndProgressionTest extends TestCase
{
    use RefreshDatabase;

    private AcademicYear $year2025;
    private Filiere $filiere;

    protected function setUp(): void
    {
        parent::setUp();

        $this->year2025 = $this->makeTestAcademicYear([
            'label'      => '2025/2026',
            'start_year' => 2025,
            'end_year'   => 2026,
            'start_date' => '2025-09-01',
            'end_date'   => '2026-06-30',
            'is_current' => true,
        ]);

        $this->filiere = $this->makeTestFiliere(['name' => 'Tronc Commun', 'code' => 'TC']);
    }

    /**
     * Test de progression des étudiants : 1A (S1) -> 2A (S3) lors du Rollover.
     */
    public function test_students_progress_to_next_academic_year_on_rollover(): void
    {
        $student = $this->makeTestStudent([
            'first_name' => 'Amine',
            'last_name'  => 'TAZI',
            'cne'        => 'N987654321',
        ]);

        $pathway = StudentPathway::create([
            'student_id'       => $student->id,
            'filiere_id'       => $this->filiere->id,
            'academic_year_id' => $this->year2025->id,
            'current_semester' => 1,
            'is_current'       => true,
        ]);

        $delibEngine = new ApogeeDeliberationEngine();
        $rolloverService = new AcademicYearRolloverService($delibEngine);

        $result = $rolloverService->executeRollover(
            $this->year2025->id,
            '2026/2027',
            '2026-09-01',
            '2027-06-30'
        );

        $this->assertTrue($result['success']);
        $this->assertEquals(1, $result['stats']['passed']);

        // Vérifier l'ancien parcours archivé
        $this->assertDatabaseHas('student_pathways', [
            'student_id'       => $student->id,
            'academic_year_id' => $this->year2025->id,
            'is_current'       => false,
        ]);

        // Vérifier le nouveau parcours en S3 (2ème Année)
        $newYear = AcademicYear::where('label', '2026/2027')->first();
        $this->assertNotNull($newYear);
        $this->assertTrue($newYear->is_current);

        $this->assertDatabaseHas('student_pathways', [
            'student_id'       => $student->id,
            'academic_year_id' => $newYear->id,
            'current_semester' => 3, // Promotion S1 -> S3
            'is_current'       => true,
        ]);
    }

    /**
     * Test de passage des étudiants de 5ème année au statut Lauréat (Graduated).
     */
    public function test_5th_year_students_become_graduated_after_final_year(): void
    {
        $student = $this->makeTestStudent([
            'first_name' => 'Sanaa',
            'last_name'  => 'ALAOUI',
            'cne'        => 'N556677889',
        ]);

        // Étudiant en S9 (5ème Année)
        StudentPathway::create([
            'student_id'       => $student->id,
            'filiere_id'       => $this->filiere->id,
            'academic_year_id' => $this->year2025->id,
            'current_semester' => 9,
            'is_current'       => true,
        ]);

        $delibEngine = new ApogeeDeliberationEngine();
        $rolloverService = new AcademicYearRolloverService($delibEngine);

        $result = $rolloverService->executeRollover(
            $this->year2025->id,
            '2026/2027',
            '2026-09-01',
            '2027-06-30'
        );

        $this->assertEquals(1, $result['stats']['graduated']);
        $this->assertEquals('graduated', $student->fresh()->status);
    }
}
