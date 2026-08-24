<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Comprehensive PDF Generation, Header Integrity, and Security Test Suite.
 */
class ComprehensivePdfGenerationAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Institution $institution;
    protected AcademicYear $academicYear;
    protected Filiere $filiere;
    protected Module $module;
    protected Student $student;
    protected User $studentUser;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->institution = Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Fès', 'code' => 'ENCGFES', 'slug' => 'encg-fes-pdf-test']
        );

        $this->academicYear = $this->ensureAcademicYear([
            'institution_id' => $this->institution->id,
        ]);

        $this->filiere = Filiere::firstOrCreate(
            ['code' => 'GFC-PDF'],
            [
                'name'           => 'Gestion Financière et Comptable',
                'type'           => 'grande_ecole',
                'duration_years' => 5,
                'institution_id' => $this->institution->id,
                'is_active'      => true,
            ]
        );

        $this->module = Module::firstOrCreate(
            ['code' => 'M501-PDF', 'filiere_id' => $this->filiere->id],
            [
                'name'            => 'Contrôle de Gestion Avancé',
                'semester_number' => 5,
                'coefficient'     => 1.5,
                'credit_hours'    => 45,
                'institution_id'  => $this->institution->id,
                'is_active'       => true,
            ]
        );

        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
        $adminRole = Role::firstOrCreate(['name' => 'institution-admin', 'guard_name' => 'sanctum']);

        $this->studentUser = User::factory()->create([
            'email'          => 'salma.benkirane@encg-fes.ac.ma',
            'first_name'     => 'Salma',
            'last_name'      => 'Benkirane',
            'institution_id' => $this->institution->id,
        ]);
        $this->studentUser->assignRole($studentRole);

        $this->adminUser = User::factory()->create([
            'email'          => 'admin.scolarite@encg-fes.ac.ma',
            'institution_id' => $this->institution->id,
        ]);
        $this->adminUser->assignRole($adminRole);

        $this->student = Student::create([
            'user_id'        => $this->studentUser->id,
            'student_number' => 'ENCG-2026-PDF01',
            'cne'            => 'N130005544',
            'gender'         => 'female',
            'status'         => 'active',
            'institution_id' => $this->institution->id,
        ]);

        StudentPathway::create([
            'student_id'       => $this->student->id,
            'filiere_id'       => $this->filiere->id,
            'academic_year_id' => $this->academicYear->id,
            'current_semester' => 5,
            'is_current'       => true,
        ]);
    }

    /**
     * 1. Test Attestation de Réussite PDF generation and HTTP headers.
     */
    public function test_attestation_reussite_pdf_generation(): void
    {
        Sanctum::actingAs($this->studentUser);

        $response = $this->get('/api/v1/student-portal/attestation-reussite/pdf');
        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('Content-Type'));
        $this->assertNotEmpty($response->getContent());
    }

    /**
     * 2. Test Grand Diplôme Officiel d'État ENCG Fès Bac+5 (A4 Paysage) generation.
     */
    public function test_grand_diplome_officiel_pdf_generation(): void
    {
        Sanctum::actingAs($this->studentUser);

        $response = $this->get('/api/v1/student-portal/diplome-officiel/pdf');
        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('Content-Type'));
        $this->assertNotEmpty($response->getContent());
    }

    /**
     * 3. Test Timetable PDF Export.
     */
    public function test_timetable_pdf_export(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->get("/api/timetable/export/filiere/{$this->filiere->id}/pdf");
        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('Content-Type'));
    }

    /**
     * 4. Test Unauthenticated Access to PDFs returns 401 Unauthorized.
     */
    public function test_unauthenticated_user_cannot_access_secure_pdfs(): void
    {
        $response = $this->get('/api/v1/student-portal/attestation-reussite/pdf', ['Accept' => 'application/json']);
        $response->assertUnauthorized();
    }
}
