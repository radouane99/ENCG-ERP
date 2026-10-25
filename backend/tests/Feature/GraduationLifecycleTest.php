<?php

namespace Tests\Feature;

use App\Actions\Academic\ConfirmStudentRenewalAction;
use App\Domain\Deliberation\ProgramCompletionRules;
use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\Institution;
use App\Models\Semester;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class GraduationLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(int $level = 3, bool $sealed = true): array
    {
        $year = $this->makeTestAcademicYear();
        $filiere = $this->makeTestFiliere(['type' => 'master_universite', 'duration_years' => 2]);
        $student = $this->makeTestStudent();
        $student->user->assignRole(Role::findOrCreate('student', 'sanctum'));
        StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'current_semester' => $level, 'is_current' => true]);
        $semester = Semester::create(['academic_year_id' => $year->id, 'name' => 'Semestre annuel test', 'number' => 2, 'start_date' => '2027-01-01', 'end_date' => '2027-06-30']);
        $jury = Deliberation::create(['institution_id' => 1, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_id' => $semester->id, 'type' => 'annual', 'is_sealed' => $sealed]);
        $decision = DeliberationDecision::create(['student_id' => $student->id, 'deliberation_id' => $jury->id, 'decision' => 'admitted', 'annual_average' => 14]);
        $staff = User::factory()->create(['institution_id' => 1]);
        $staff->assignRole(Role::findOrCreate('scolarite', 'sanctum'));
        Sanctum::actingAs($staff);

        return [$student, $decision, $year, $filiere];
    }

    public function test_master_graduation_is_idempotent_visible_without_survey_and_excluded_from_renewals(): void
    {
        [$student, $decision, $year, $filiere] = $this->fixture();
        StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 3, 'registration_type' => 're_enrollment', 'status' => 'academic_validated']);
        $this->getJson('/api/alumni/graduation-candidates')->assertOk()->assertJsonPath('data.0.decision_id', $decision->id);
        for ($i = 0; $i < 2; $i++) {
            $this->postJson('/api/alumni/graduates/finalize', ['decision_id' => $decision->id])->assertOk();
        }
        $this->assertSame('graduated', $student->refresh()->status);
        $this->assertFalse($student->latestPathway->is_current);
        $this->getJson('/api/alumni/graduates')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $student->id);
        $this->getJson('/api/admin/reinscriptions/stats')->assertOk()->assertJsonPath('data.total_eligible', 0);
        $this->assertDatabaseCount('deliberation_decisions', 1);
        $this->assertDatabaseCount('student_registrations', 1);
        $this->assertDatabaseCount('student_graduations', 1);
        Sanctum::actingAs($student->user);
        $this->getJson('/api/student-portal/reinscription/status')->assertOk()->assertJsonPath('data.is_graduated', true)->assertJsonPath('data.can_confirm', false);
        $this->postJson('/api/student-portal/reinscription/confirm', ['phone' => '0612345678', 'address' => 'Test', 'city' => 'Fès'])->assertUnprocessable();
        $this->getJson('/api/alumni/graduates')->assertForbidden();
        $this->postJson('/api/alumni/graduates/finalize', ['decision_id' => $decision->id])->assertForbidden();
    }

    public function test_unsealed_or_non_terminal_decisions_cannot_graduate_a_student(): void
    {
        [$student, $decision] = $this->fixture(1, false);
        $this->postJson('/api/alumni/graduates/finalize', ['decision_id' => $decision->id])->assertUnprocessable();
        $decision->deliberation->update(['is_sealed' => true]);
        $this->postJson('/api/alumni/graduates/finalize', ['decision_id' => $decision->id])->assertUnprocessable();
        $this->assertSame('active', $student->refresh()->status);
        $this->getJson('/api/alumni/graduation-candidates')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_initial_speciality_keeps_ten_semesters_and_master_uses_its_duration(): void
    {
        $rules = ProgramCompletionRules::class;
        $this->assertSame(10, $rules::finalSemester('grande_ecole', 2));
        $this->assertSame(4, $rules::finalSemester('master_temps_amenage', 2));
        $this->assertSame(6, $rules::finalSemester('licence_universite', 3));
        $this->assertNull($rules::finalSemester('du', null));
    }

    public function test_legacy_rollover_does_not_promote_incomplete_dossiers_and_static_codes_are_rejected(): void
    {
        [, , $year] = $this->fixture(1, false);
        $staff = auth()->user();
        $staff->assignRole(Role::findOrCreate('admin', 'sanctum'));
        $staff->update(['password' => 'ActualTestPassword123!']);
        $this->postJson('/api/academic-years/'.$year->id.'/rollover', [
            'new_label' => '2027/2028', 'start_date' => '2027-09-01', 'end_date' => '2028-06-30',
        ])->assertUnprocessable();
        $this->assertTrue($year->refresh()->is_current);
        $this->assertDatabaseMissing('academic_years', ['label' => '2027/2028']);
        $this->postJson('/api/academic-archiving/verify-security-code', ['security_code' => 'ENCG-ARCHIVE-SECURE'])->assertForbidden();
        $this->postJson('/api/academic-archiving/verify-security-code', ['security_code' => 'ActualTestPassword123!'])->assertOk();
    }

    public function test_failed_decisions_and_foreign_institution_cannot_finalize_graduation(): void
    {
        [$student, $decision] = $this->fixture();
        $decision->update(['decision' => 'retake']);
        $this->postJson('/api/alumni/graduates/finalize', ['decision_id' => $decision->id])->assertUnprocessable();
        $decision->update(['decision' => 'admitted']);
        $institution = Institution::create(['name' => 'Other school', 'code' => 'OTHER', 'slug' => 'other']);
        $staff = User::factory()->create(['institution_id' => $institution->id]);
        $staff->assignRole(Role::findOrCreate('scolarite', 'sanctum'));
        Sanctum::actingAs($staff);
        $this->postJson('/api/alumni/graduates/finalize', ['decision_id' => $decision->id])->assertForbidden();
        $this->getJson('/api/alumni/graduation-candidates')->assertForbidden();
        $this->assertSame('active', $student->refresh()->status);
    }

    public function test_ambiguous_or_out_of_program_renewal_is_not_eligible(): void
    {
        [$student, , $year, $filiere] = $this->fixture();
        $action = app(ConfirmStudentRenewalAction::class);
        $registration = StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 5, 'registration_type' => 're_enrollment', 'status' => 'academic_validated']);
        $this->assertNull($action->eligibleRegistration($student, $year->id));
        $this->getJson('/api/admin/reinscriptions/stats')->assertOk()->assertJsonPath('data.total_pending', 0)->assertJsonPath('data.total_needs_review', 1);
        $registration->update(['semester_number' => 3]);
        $this->assertNotNull($action->eligibleRegistration($student, $year->id));
        StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 1, 'registration_type' => 're_enrollment', 'status' => 'pending']);
        $this->assertNull($action->eligibleRegistration($student, $year->id));
    }

    public function test_graduation_history_survives_a_later_active_student_status(): void
    {
        [$student, $decision, $year, $filiere] = $this->fixture();
        $this->postJson('/api/alumni/graduates/finalize', ['decision_id' => $decision->id])->assertOk();
        $student->refresh()->update(['status' => 'active']);
        $this->postJson('/api/alumni/graduates/finalize', ['decision_id' => $decision->id])->assertOk();
        $this->assertSame('active', $student->refresh()->status);
        $this->getJson('/api/alumni/graduates')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.graduations.0.filiere_name', $filiere->name);
        $this->assertDatabaseCount('student_graduations', 1);
        StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'semester_number' => 3, 'registration_type' => 're_enrollment', 'status' => 'academic_validated']);
        $this->assertNull(app(ConfirmStudentRenewalAction::class)->eligibleRegistration($student, $year->id));
    }

    public function test_archiving_counts_use_recorded_decisions_and_graduations(): void
    {
        [$student, $decision] = $this->fixture();
        auth()->user()->assignRole(Role::findOrCreate('admin', 'sanctum'));
        $this->getJson('/api/archiving-stats')->assertOk()->assertJsonPath('data.archives.0.studentsCount', 1)
            ->assertJsonPath('data.archives.0.admittedCount', 1)->assertJsonPath('data.archives.0.repeatedCount', 0)
            ->assertJsonPath('data.archives.0.graduatedCount', 0)->assertJsonPath('data.archives.0.blockchainHash', '')
            ->assertJsonPath('data.archives.0.pvChecksum', 'Aucun PV scellé enregistré');
        $this->postJson('/api/alumni/graduates/finalize', ['decision_id' => $decision->id])->assertOk();
        $this->getJson('/api/archiving-stats')->assertOk()->assertJsonPath('data.archives.0.graduatedCount', 1);
    }
}
