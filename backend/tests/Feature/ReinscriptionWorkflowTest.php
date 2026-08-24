<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
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
            'last_name' => 'EL FASSI',
            'cne' => 'N778899001',
        ]);
        $this->studentUser = $this->student->user;
        $role = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
        $this->studentUser->assignRole($role);

        StudentPathway::create([
            'student_id' => $this->student->id,
            'filiere_id' => $this->filiere->id,
            'academic_year_id' => $this->academicYear->id,
            'current_semester' => 3,
            'is_current' => true,
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
            'phone' => '0612345678',
            'address' => 'Résidence Al Wahda, Route Immouzer, Fès',
            'city' => 'Fès',
            'filiere_id' => $this->filiere->id,
            'has_insurance' => true,
        ];

        $response = $this->postJson('/api/v1/student-portal/reinscription/confirm', $payload);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['success', 'message', 'receipt_reference', 'target_level']);

        $this->assertDatabaseHas('users', [
            'id' => $this->studentUser->id,
            'phone' => '0612345678',
            'city' => 'Fès',
        ]);
    }

    public function test_ouvrir_reinscription_uses_command_year_not_calendar_year(): void
    {
        Mail::fake();
        Carbon::setTestNow('2026-08-24');

        $this->student->update([
            'inscription_status' => 'reinscrit',
            'academic_year' => '2027-2028',
        ]);

        $eligible = $this->makeTestStudent([
            'first_name' => 'Sara',
            'last_name' => 'AMRANI',
            'cne' => 'N778899002',
        ]);
        $eligible->update([
            'inscription_status' => 'inscrit',
            'academic_year' => '2025-2026',
        ]);
        StudentPathway::create([
            'student_id' => $eligible->id,
            'filiere_id' => $this->filiere->id,
            'academic_year_id' => $this->academicYear->id,
            'current_semester' => 3,
            'is_current' => true,
        ]);

        $this->artisan('reinscription:ouvrir', ['--annee' => '2028'])->assertSuccessful();

        $this->student->refresh();
        $eligible->refresh();

        $this->assertSame('reinscrit', $this->student->inscription_status);
        $this->assertSame('2027-2028', $this->student->academic_year);
        $this->assertDatabaseMissing('student_dossier_audit_logs', [
            'student_id' => $this->student->id,
            'action' => 'reinscription_blocked',
        ]);

        $this->artisan('reinscription:ouvrir', ['--annee' => '2028'])->assertSuccessful();
        $this->assertSame(
            0,
            \App\Domain\Student\Models\StudentDossierAuditLog::query()
                ->where('student_id', $this->student->id)
                ->where('action', 'reinscription_blocked')
                ->count()
        );

        $this->assertSame('reinscrit', $eligible->inscription_status);
        $this->assertSame('2027-2028', $eligible->academic_year);
        $targetYear = AcademicYear::query()
            ->where('start_year', 2027)
            ->where('end_year', 2028)
            ->first();
        $this->assertNotNull($targetYear);
        $this->assertDatabaseHas('student_pathways', [
            'student_id' => $eligible->id,
            'is_current' => true,
            'academic_year_id' => $targetYear->id,
        ]);
        $this->assertDatabaseHas('student_dossier_audit_logs', [
            'student_id' => $eligible->id,
            'action' => \App\Domain\Student\Models\StudentDossierAuditLog::ACTION_REINSCRIPTION,
            'old_value' => 'inscrit',
            'new_value' => 'reinscrit',
        ]);

        Carbon::setTestNow();
    }
}
