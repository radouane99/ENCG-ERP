<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReinscriptionWorkflowTest extends TestCase
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
        $this->filiere = $this->makeTestFiliere(['name' => 'Commerce International', 'code' => 'CI']);

        $this->student = $this->makeTestStudent([
            'first_name' => 'Ilyas',
            'last_name'  => 'EL FASSI',
            'cne'        => 'N778899001',
        ]);
        $this->studentUser = $this->student->user;
        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
        $this->studentUser->assignRole($role);

        StudentPathway::create([
            'student_id'       => $this->student->id,
            'filiere_id'       => $this->filiere->id,
            'academic_year_id' => $this->academicYear->id,
            'current_semester' => 3,
            'is_current'       => true,
        ]);
    }

    /**
     * Test de récupération du statut de réinscription de l'étudiant.
     */
    public function test_student_can_fetch_reinscription_status(): void
    {
        Sanctum::actingAs($this->studentUser);

        $response = $this->getJson('/api/v1/student-portal/reinscription/status');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.cne', 'N778899001')
            ->assertJsonPath('data.is_admis', true);
    }

    /**
     * Test de confirmation de réinscription avec mise à jour des coordonnées et groupe.
     */
    public function test_student_can_confirm_reinscription(): void
    {
        Sanctum::actingAs($this->studentUser);

        $payload = [
            'phone'         => '0612345678',
            'address'       => 'Résidence Al Wahda, Route Immouzer, Fès',
            'city'          => 'Fès',
            'filiere_id'    => $this->filiere->id,
            'has_insurance' => true,
        ];

        $response = $this->postJson('/api/v1/student-portal/reinscription/confirm', $payload);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['success', 'message', 'receipt_reference', 'target_level']);

        $this->assertDatabaseHas('users', [
            'id'    => $this->studentUser->id,
            'phone' => '0612345678',
            'city'  => 'Fès',
        ]);
    }
}
