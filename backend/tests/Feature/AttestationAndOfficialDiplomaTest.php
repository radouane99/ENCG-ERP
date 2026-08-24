<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttestationAndOfficialDiplomaTest extends TestCase
{
    use RefreshDatabase;

    private User $studentUser;

    private Student $student;

    private AcademicYear $academicYear;

    private Filiere $filiere;

    protected function setUp(): void
    {
        parent::setUp();

        $this->academicYear = $this->makeTestAcademicYear();
        $this->filiere = $this->makeTestFiliere([
            'name' => 'Gestion Financière et Comptable',
            'code' => 'GFC',
        ]);

        $this->student = $this->makeTestStudent([
            'first_name' => 'Salma',
            'last_name' => 'BENKIRANE',
            'cne' => 'N112233445',
        ]);
        $this->studentUser = $this->student->user;
        $role = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
        $this->studentUser->assignRole($role);

        StudentPathway::create([
            'student_id' => $this->student->id,
            'filiere_id' => $this->filiere->id,
            'academic_year_id' => $this->academicYear->id,
            'current_semester' => 4,
            'is_current' => true,
        ]);
    }

    /**
     * Test de génération de l'attestation de réussite pour un étudiant ayant validé son année.
     */
    public function test_can_download_attestation_reussite(): void
    {
        Sanctum::actingAs($this->studentUser);

        $response = $this->get('/api/v1/student-portal/attestation-reussite/pdf');
        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('Content-Type') ?? '');
    }

    /**
     * Test de génération du Grand Diplôme d'État ENCG Fès (Bac+5 / Grade Master).
     */
    public function test_can_download_grand_diplome_officiel_encg(): void
    {
        Sanctum::actingAs($this->studentUser);

        $response = $this->get('/api/v1/student-portal/diplome-officiel/pdf');

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('Content-Type') ?? '');
    }
}
