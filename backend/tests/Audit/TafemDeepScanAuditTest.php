<?php

namespace Tests\Feature;

use App\Domain\Auth\Services\RegisterUserService;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\User;
use App\OCR\Engines\PdfTextEngine;
use App\OCR\Engines\TesseractEngine;
use App\Services\Admissions\TafemQualityReportService;
use App\Services\AI\GeminiApiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

// Regression guarantees from the audit. Dossier details now require an authenticated owner.
// Existing personal accounts retain the account-takeover guard; activation has dedicated feature tests.
class TafemDeepScanAuditTest extends TestCase
{
    use RefreshDatabase;

    private function candidate(string $status = 'pending'): Student
    {
        $user = User::factory()->create(['cin' => 'AB123456']);

        return Student::create(['institution_id' => 1, 'user_id' => $user->id,
            'cne' => 'N123456789', 'student_number' => 'AUDIT-001', 'gender' => 'male', 'status' => $status]);
    }

    public function test_upload_rejects_wrong_cin_and_locked_dossier(): void
    {
        Storage::fake('private');
        $s = $this->candidate('active');
        $this->post('/api/public/upload-candidate-document', ['cne' => $s->cne,
            'cin' => 'ZZ999999', 'type' => 'bac',
            'file' => UploadedFile::fake()->create('audit.pdf', 1, 'application/pdf')],
            ['Accept' => 'application/json'])->assertStatus(401);
    }

    public function test_delete_rejects_wrong_cin(): void
    {
        $s = $this->candidate();
        StudentDocument::create(['cne' => $s->cne, 'type' => 'bac', 'file_path' => 'audit.pdf']);
        $this->deleteJson('/api/public/delete-candidate-document', ['cne' => $s->cne,
            'cin' => 'ZZ999999', 'type' => 'bac'])->assertStatus(401);
        $this->assertDatabaseCount('student_documents', 1);
    }

    public function test_public_preinscription_cannot_downgrade_another_active_student(): void
    {
        $s = $this->candidate('active');
        $this->postJson('/api/public/preinscription', ['cne' => $s->cne,
            'cin' => 'ZZ999999', 'name' => 'Synthetic Audit', 'email' => 'audit@example.test'])
            ->assertStatus(401);
        $this->assertSame('active', $s->fresh()->status);
    }

    public function test_matching_massar_is_not_reported_as_mismatch(): void
    {
        $s = $this->candidate();
        $s->forceFill(['massar_code' => $s->cne])->save();
        $this->assertSame(0, app(TafemQualityReportService::class)->build(false)['massar_mismatch']);
    }

    public function test_update_rejects_wrong_cin(): void
    {
        $s = $this->candidate();
        $this->applicationOnly();
        $this->postJson('/api/public/update-candidate-dossier', ['cne' => $s->cne,
            'cin' => 'ZZ999999', 'first_name' => 'Unauthorized Change'])->assertStatus(401);
    }

    public function test_receipt_rejects_unknown_candidate_instead_of_fabricating_admission(): void
    {
        $this->get('/api/public/recepisse-tafem-pdf?cne=Z999999999&cin=ZZ999999',
            ['Accept' => 'application/json'])->assertForbidden();
    }

    public function test_ocr_rejects_out_of_range_grade(): void
    {
        $data = app(GeminiApiService::class)->cleanAndNormalizeOcrData(['bac_average' => 99]);
        $this->assertTrue(empty($data['bac_average']), 'A grade above 20 must require correction.');
    }

    public function test_ocr_does_not_accept_impossible_date_or_out_of_range_grade(): void
    {
        $data = app(GeminiApiService::class)->cleanAndNormalizeOcrData([
            'birth_date' => '31/02/2006', 'bac_average' => 99,
        ]);
        $this->assertTrue(empty($data['birth_date']), 'An impossible calendar date must require correction.');
        $this->assertTrue(empty($data['bac_average']), 'A grade above 20 must require correction.');
    }

    public function test_imported_candidate_is_rejected_by_current_registration_service(): void
    {
        $year = $this->makeTestAcademicYear();
        $f = $this->makeTestFiliere();
        $campaign = AdmissionCampaign::create(['institution_id' => 1, 'academic_year_id' => $year->id,
            'filiere_id' => $f->id, 'name' => 'Audit', 'open_date' => '2026-01-01',
            'close_date' => '2026-12-31', 'status' => 'open', 'target_capacity' => 10]);
        Application::create(['admission_campaign_id' => $campaign->id, 'reference_number' => 'AUDIT-IMPORT',
            'cne' => 'N123456789', 'cin' => 'AB123456', 'first_name' => 'Audit',
            'last_name' => 'Synthetic', 'status' => 'admis_tafem']);
        Http::preventStrayRequests();
        $this->expectException(ValidationException::class);
        app(RegisterUserService::class)->registerUser(['cne' => 'N123456789', 'cin' => 'AB123456',
            'first_name' => 'Audit', 'last_name' => 'Synthetic', 'email' => 'audit@example.test',
            'password' => 'SyntheticPassword123!']);
    }

    public function test_real_local_pdf_and_raster_ocr_extract_synthetic_identity(): void
    {
        Http::preventStrayRequests();
        // OCR ingests external identity evidence, not a branded ERP document with a registry footer.
        $fixture = new \Dompdf\Dompdf;
        $fixture->loadHtml('<html><body><h1>SYNTHETIC AUDIT DOCUMENT</h1><p>CIN AB123456</p><p>CNE N123456789</p><p>NOM SYNTHETIQUE</p></body></html>');
        $fixture->render();
        $pdf = $fixture->output();
        $path = tempnam(sys_get_temp_dir(), 'tafem_audit_').'.pdf';
        try {
            file_put_contents($path, $pdf);
            $text = (new PdfTextEngine)->extract($path, 'application/pdf', 'cnie')->text;
            $this->assertStringContainsString('AB123456', $text);
            $raster = (new TesseractEngine)->extract($path, 'application/pdf', 'cnie')->text;
            $this->assertStringContainsString('AB123456', $raster);
        } finally {
            @unlink($path);
            @unlink(substr($path, 0, -4));
        }
    }

    private function applicationOnly(): Application
    {
        $year = $this->makeTestAcademicYear();
        $f = $this->makeTestFiliere();
        $campaign = AdmissionCampaign::create(['institution_id' => 1, 'academic_year_id' => $year->id,
            'filiere_id' => $f->id, 'name' => 'Audit', 'open_date' => '2026-01-01',
            'close_date' => '2026-12-31', 'status' => 'open', 'target_capacity' => 10]);

        return Application::create(['admission_campaign_id' => $campaign->id,
            'reference_number' => 'AUDIT-ONLY', 'cne' => 'N123456789', 'cin' => 'AB123456',
            'first_name' => 'Synthetic', 'last_name' => 'Candidate', 'status' => 'submitted']);
    }

    public function test_application_only_tracking_does_not_mix_unrelated_documents(): void
    {
        $app = $this->applicationOnly();
        $owner = User::factory()->create(['institution_id' => 1]);
        $app->update(['owner_user_id' => $owner->id]);
        Sanctum::actingAs($owner);
        StudentDocument::create(['cne' => 'Z999999999', 'type' => 'bac',
            'file_path' => 'unrelated.pdf', 'original_filename' => 'UNRELATED-SYNTHETIC.pdf']);
        $response = $this->getJson('/api/public/track-dossier?cne='.$app->cne.'&cin='.$app->cin)->assertOk();
        $this->assertEmpty($response->json('candidate.documents'), 'Other candidates documents must not enter this dossier.');
    }

    public function test_authenticated_user_cannot_track_another_application_by_cne(): void
    {
        $app = $this->applicationOnly();
        Sanctum::actingAs(User::factory()->create(['cin' => 'ZZ999999']));
        $this->getJson('/api/public/track-dossier?cne='.$app->cne)->assertNotFound();
    }

    public function test_professor_cannot_validate_physical_admission_dossier(): void
    {
        $s = $this->candidate();
        $teacher = User::factory()->create(['institution_id' => 1]);
        $teacher->assignRole(Role::findOrCreate('professor', 'sanctum'));
        Sanctum::actingAs($teacher);
        $this->postJson('/api/admin/tafem/verify-physical-dossier', ['student_id' => $s->id,
            'bac_original' => true, 'releve_notes' => true, 'cin_copy' => true, 'photos' => true])
            ->assertForbidden();
    }
}
