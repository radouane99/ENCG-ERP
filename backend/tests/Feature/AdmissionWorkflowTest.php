<?php

namespace Tests\Feature;

use App\Jobs\ProcessAdmissionOcrJob;
use App\Jobs\SendAdmissionNotificationJob;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Services\Ocr\AdmissionOcrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Spatie\Permission\Models\Role;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class AdmissionWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private const BASE = '/api/admissions/workflow';

    public function test_gemini_reads_uploaded_pdf_directly_and_automatic_queue_uses_cloud_policy(): void
    {
        Http::preventStrayRequests();
        Storage::fake('private');
        config(['services.gemini.key' => 'synthetic-gemini-key', 'services.gemini.ocr_model' => 'synthetic-gemini']);
        $a = $this->candidate();
        $this->login($a);
        $institution = $a->campaign->institution;
        $settings = $institution->settings ?? [];
        $settings['admissions']['ocr_cloud_enabled'] = true;
        $institution->update(['settings' => $settings]);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['candidates' => [['content' => ['parts' => [['text' => json_encode([
            'cin' => 'AB123456', 'address' => '12 RUE SYNTHETIQUE', 'address_ar' => 'عنوان تجريبي',
            'birth_city' => 'MEKNES', 'birth_city_ar' => 'مكناس', 'status' => 'approved',
        ])]]]]]])]);
        $pdf = app('dompdf.wrapper')->loadHTML('<html><body>CNIE SYNTHETIQUE RECTO VERSO CIN AB123456</body></html>')->output();
        $uploaded = $this->post(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version,
            'type' => 'cnie', 'file' => UploadedFile::fake()->createWithContent('cnie.pdf', $pdf)], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('candidate.ocr_runs.0.mode', 'cloud');
        $runId = $uploaded->json('candidate.ocr_runs.0.id');
        $job = new class($runId) extends ProcessAdmissionOcrJob
        {
            public ?\Throwable $failure = null;

            public function failed(?\Throwable $e): void
            {
                $this->failure = $e;
                parent::failed($e);
            }
        };
        $job->handle(app(AdmissionOcrService::class));
        $this->assertNull($job->failure, $job->failure?->getMessage() ?? '');
        $result = $this->getJson(self::BASE.'/ocr/'.$runId)->assertOk()->assertJsonPath('fields.address_ar.value', 'عنوان تجريبي')
            ->assertJsonPath('fields.birth_city.value', 'MEKNES');
        $this->assertStringContainsString('+gemini:synthetic-gemini', $result->json('engine'));
        $this->assertArrayNotHasKey('status', $result->json('fields'));
        Http::assertSent(fn ($request) => $request->hasHeader('x-goog-api-key', 'synthetic-gemini-key')
            && ! str_contains($request->url(), 'key=')
            && $request['contents'][0]['parts'][0]['inlineData']['mimeType'] === 'application/pdf'
            && base64_decode($request['contents'][0]['parts'][0]['inlineData']['data']) === $pdf);
        Http::assertSentCount(1);
        $this->assertSame('draft', $a->fresh()->dossier_status);
    }

    public function test_failed_gemini_falls_back_to_groq_images_without_public_document_url(): void
    {
        Http::preventStrayRequests();
        Storage::fake('private');
        config(['services.gemini.key' => 'synthetic-gemini-key', 'services.gemini.ocr_model' => 'synthetic-gemini',
            'services.groq.key' => 'synthetic-groq-key', 'services.groq.vision_model' => 'synthetic-vision']);
        $a = $this->candidate();
        $institution = $a->campaign->institution;
        $settings = $institution->settings ?? [];
        $settings['admissions']['ocr_cloud_enabled'] = true;
        $institution->update(['settings' => $settings]);
        $pdf = app('dompdf.wrapper')->loadHTML('<html><body>CNE N123456789 CIN AB123456 SYNTHETIC TRANSCRIPT</body></html>')->output();
        Storage::disk('private')->put('vision-test.pdf', $pdf);
        $doc = StudentDocument::create(['application_id' => $a->id, 'type' => 'releve_notes', 'file_path' => 'vision-test.pdf', 'storage_disk' => 'private', 'mime_type' => 'application/pdf']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['error' => 'PRIVATE_PROVIDER_ERROR'], 503),
            'api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => '{"bac_average":16.5,"bac_type":"Sciences Mathématiques A"}']]]])]);
        $result = app(AdmissionOcrService::class)->extract($doc, 'cloud');
        $this->assertSame(16.5, $result['fields']['bac_average']['value']);
        $this->assertSame('Sciences Mathématiques A', $result['fields']['bac_type']['value']);
        $this->assertStringContainsString('+groq:synthetic-vision', $result['engine']);
        $this->assertStringNotContainsString('PRIVATE_PROVIDER_ERROR', json_encode($result));
        Http::assertSent(fn ($request) => str_contains($request->url(), 'api.groq.com')
            && $request['model'] === 'synthetic-vision'
            && str_starts_with($request['messages'][1]['content'][1]['image_url']['url'], 'data:image/jpeg;base64,'));
        Http::assertSentCount(2);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake([ProcessAdmissionOcrJob::class]);
        config(['services.gemini.key' => '', 'services.groq.key' => '', 'services.groq.api_key' => '']);
    }

    public function test_upload_automatically_queues_local_ocr_once_without_student_choice(): void
    {
        Http::preventStrayRequests();
        $a = $this->candidate();
        $this->login($a);
        Storage::fake('private');
        $payload = ['application_id' => $a->id, 'type' => 'bac',
            'file' => UploadedFile::fake()->createWithContent('bac.pdf', '%PDF-1.4 SYNTHETIC')];
        $r = $this->post(self::BASE.'/documents', $payload + ['version' => $a->fresh()->version], ['Accept' => 'application/json'])->assertOk()
            ->assertJsonPath('candidate.ocr_runs.0.status', 'queued')->assertJsonPath('candidate.ocr_runs.0.mode', 'local');
        $id = $r->json('document.id');
        $this->post(self::BASE.'/documents', $payload + ['version' => $a->fresh()->version], ['Accept' => 'application/json'])->assertOk();
        $this->assertSame(1, DB::table('admission_ocr_runs')->where('document_id', $id)->count());
        Queue::assertPushed(ProcessAdmissionOcrJob::class, 1);
        Http::assertNothingSent();
        $this->post(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version,
            'type' => 'photo', 'file' => UploadedFile::fake()->image('photo.jpg', 300, 400)], ['Accept' => 'application/json'])->assertOk();
        Queue::assertPushed(ProcessAdmissionOcrJob::class, 1);
    }

    public function test_cnie_two_images_are_saved_as_one_two_page_private_document(): void
    {
        $a = $this->candidate();
        $this->login($a);
        Storage::fake('private');
        $r = $this->post(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version,
            'type' => 'cnie', 'file' => UploadedFile::fake()->image('recto.jpg', 900, 600),
            'file_verso' => UploadedFile::fake()->image('verso.jpg', 900, 600)], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('document.mime_type', 'application/pdf');
        $doc = StudentDocument::findOrFail($r->json('document.id'));
        $pdf = Storage::disk('private')->get($doc->file_path);
        $this->assertStringStartsWith('%PDF-', $pdf);
        $this->assertSame(2, preg_match_all('~/Type\s*/Page\b~', $pdf));
        $this->assertSame(1, DB::table('admission_ocr_runs')->where('document_id', $doc->id)->count());
        $this->post(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version,
            'type' => 'cnie', 'file' => UploadedFile::fake()->image('recto-seul.jpg', 900, 600)],
            ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('file_verso');
    }

    public function test_automatic_local_ocr_preserves_residence_birthplace_and_bac_details(): void
    {
        Http::preventStrayRequests();
        Storage::fake('private');
        $a = $this->candidate();
        $this->login($a);
        $pdf = app('dompdf.wrapper')->loadHTML('<html><body><p>CIN : AB123456</p><p>Lieu de naissance : MEKNES</p><p>Adresse : 12 RUE SYNTHETIQUE FES</p></body></html>')->output();
        $response = $this->post(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version,
            'type' => 'cnie', 'file' => UploadedFile::fake()->createWithContent('cnie.pdf', $pdf)], ['Accept' => 'application/json'])->assertOk();
        $id = $response->json('candidate.ocr_runs.0.id');
        (new ProcessAdmissionOcrJob($id))->handle(app(AdmissionOcrService::class));
        $this->getJson(self::BASE.'/ocr/'.$id)->assertOk()->assertJsonPath('fields.birth_city.value', 'MEKNES')
            ->assertJsonPath('fields.address.value', '12 RUE SYNTHETIQUE FES')->assertJsonPath('fields.cin.conflict', false);
        Http::assertNothingSent();
    }

    private function campaign(): AdmissionCampaign
    {
        $year = $this->makeTestAcademicYear();
        $filiere = $this->makeTestFiliere();

        return AdmissionCampaign::firstOrCreate(['academic_year_id' => $year->id], ['institution_id' => 1,
            'filiere_id' => $filiere->id, 'name' => 'TAFEM Test', 'status' => 'open',
            'open_date' => now()->subMonth()->toDateString(), 'close_date' => now()->addMonth()->toDateString(), 'target_capacity' => 2]);
    }

    private function candidate(string $cne = 'N123456789', string $cin = 'AB123456'): Application
    {
        $c = $this->campaign();
        $user = User::factory()->create(['cin' => $cin, 'institution_id' => 1]);
        $user->assignRole(Role::findOrCreate('student', 'sanctum'));

        return Application::create(['admission_campaign_id' => $c->id, 'reference_number' => 'TEST-'.$cne,
            'cne' => $cne, 'cin' => $cin, 'owner_user_id' => $user->id, 'first_name' => 'Synthetic', 'last_name' => 'Candidate',
            'email' => $user->email, 'status' => 'pending', 'dossier_status' => 'draft', 'eligibility' => 'main',
            'profile' => ['phone' => '0612345678', 'birth_date' => '2006-02-12', 'address' => 'Test address', 'gender' => 'female', 'bac_average' => 16.5, 'bac_year' => 2026]]);
    }

    private function login(Application $app): void
    {
        Sanctum::actingAs(User::findOrFail($app->owner_user_id));
    }

    public function test_preregistration_receipt_contains_private_photo_profile_and_massar_qr(): void
    {
        $a = $this->candidate();
        $this->login($a);
        $this->documents($a);
        $this->get(self::BASE.'/receipt?application_id='.$a->id)->assertStatus(422);
        $a->update(['submitted_at' => now(), 'dossier_status' => 'submitted']);
        $data = [];
        View::composer('pdf.admission-preregistration', function ($view) use (&$data) {
            $data = $view->getData();
        });
        $response = $this->get(self::BASE.'/receipt?application_id='.$a->id)->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
        $this->assertSame(1, preg_match_all('~/Type\s*/Page\b~', $response->getContent()));
        $html = view('pdf.admission-preregistration', $data)->render();
        $this->assertStringContainsString('data:image/png;base64,', $html);
        $this->assertStringContainsString('data:image/svg+xml;base64,', $html);
        $this->assertStringContainsString($a->cne, $html);
        $this->assertStringContainsString('Test address', $html);
        $this->assertStringContainsString('préinscription', $html);
        $expectedUrl = rtrim(config('app.frontend_url') ?: config('app.url'), '/').'/academic/enrollments?'.http_build_query([
            'campaign_id' => $a->admission_campaign_id, 'application_id' => $a->id, 'cne' => $a->cne,
        ]);
        $this->assertSame('data:image/svg+xml;base64,'.base64_encode(QrCode::format('svg')->size(180)->margin(2)->generate($expectedUrl)), $data['qrData']);
        if (getenv('ADMISSION_PDF_PREVIEW')) {
            file_put_contents(storage_path('app/preregistration-synthetic-preview.pdf'), $response->getContent());
        }
        $this->login($this->candidate('Z999999999', 'CD999999'));
        $this->get(self::BASE.'/receipt?application_id='.$a->id)->assertNotFound();
    }

    private function staff(string $role = 'scolarite'): void
    {
        $u = User::factory()->create(['institution_id' => 1]);
        $u->assignRole(Role::findOrCreate($role, 'sanctum'));
        Sanctum::actingAs($u);
    }

    private function documents(Application $a): void
    {
        Storage::fake('private');
        foreach (['bac', 'cnie', 'releve_notes', 'photo'] as $type) {
            $file = $type === 'photo' ? UploadedFile::fake()->image('photo.jpg', 300, 400) : UploadedFile::fake()->create('scan.pdf', 2, 'application/pdf');
            $this->post(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version,
                'type' => $type, 'file' => $file], ['Accept' => 'application/json'])->assertOk();
        }
    }

    public function test_guests_and_unrelated_accounts_cannot_access_or_mutate_dossiers(): void
    {
        $a = $this->candidate();
        $this->postJson('/api/public/update-candidate-dossier', ['cne' => $a->cne, 'cin' => 'WRONG'])->assertUnauthorized();
        $this->getJson('/api/public/track-dossier?cne='.$a->cne.'&cin='.$a->cin)->assertUnauthorized();
        Sanctum::actingAs(User::factory()->create(['institution_id' => 1]));
        $this->getJson(self::BASE.'/dossier?application_id='.$a->id)->assertNotFound();
        $this->postJson(self::BASE.'/dossier', ['application_id' => $a->id, 'version' => 1, 'first_name' => 'Attacker'])->assertNotFound();
    }

    public function test_profile_save_is_owned_versioned_and_does_not_mark_enrolled(): void
    {
        $a = $this->candidate();
        $this->login($a);
        $payload = ['application_id' => $a->id, 'version' => 1, 'first_name' => 'Corrected'];
        $this->postJson(self::BASE.'/dossier', $payload)->assertOk()->assertJsonPath('candidate.dossier_status', 'draft')->assertJsonPath('candidate.version', 2);
        $this->postJson(self::BASE.'/dossier', $payload)->assertConflict();
        $this->assertDatabaseHas('users', ['id' => $a->owner_user_id, 'first_name' => 'Corrected']);
        $this->assertSame('pending', $a->fresh()->status);
    }

    public function test_extended_profile_roundtrip_preserves_legacy_parent_and_ignores_administrative_input(): void
    {
        $a = $this->candidate();
        $a->update(['profile' => array_merge($a->profile, ['father_name' => 'Nom compose historique'])]);
        $this->login($a);
        $fields = ['birth_city_ar' => 'فاس', 'nationality_ar' => 'مغربية', 'country' => 'Maroc',
            'region' => 'Fès-Meknès', 'delegation' => 'Fès', 'address_ar' => 'عنوان تجريبي',
            'marital_status' => 'single', 'father_first_name' => 'Parent', 'father_cin' => 'TEST123',
            'mother_first_name' => 'Mere', 'mother_last_name' => 'Test', 'mother_profession' => 'Profession test',
            'bac_mention' => 'Bien', 'has_prior_higher_education' => true, 'first_higher_education_year' => 2024,
            'first_university_enrollment_year' => 2024, 'previous_university' => 'Université test',
            'has_medical_followup' => true, 'treating_doctor_info' => 'Contact privé synthétique'];
        $response = $this->postJson(self::BASE.'/dossier', array_merge($fields, [
            'application_id' => $a->id, 'version' => $a->fresh()->version,
            'registration_status' => 'enrolled', 'registration_date' => '2026-01-01',
            'administrative_context' => ['renewals' => [['academic_year' => '2099']]],
        ]))->assertOk();
        foreach ($fields as $key => $value) {
            $response->assertJsonPath('candidate.profile.'.$key, $value);
        }
        $response->assertJsonPath('candidate.profile.father_name', 'Nom compose historique')
            ->assertJsonPath('candidate.profile.mother_name', 'Mere Test')
            ->assertJsonPath('candidate.administrative_context.registration_status', 'draft')
            ->assertJsonPath('candidate.administrative_context.registration_date', null)
            ->assertJsonPath('candidate.administrative_context.renewals', []);
        $this->assertArrayNotHasKey('registration_status', $a->fresh()->profile);
        $this->assertArrayNotHasKey('administrative_context', $a->fresh()->profile);
        $this->getJson(self::BASE.'/dossier')->assertOk()->assertJsonPath('candidate.profile.address_ar', $fields['address_ar']);
        $this->login($this->candidate('Z999999999', 'CD999999'));
        $this->getJson(self::BASE.'/dossier?application_id='.$a->id)->assertNotFound();
    }

    public function test_administrative_history_uses_only_the_linked_students_real_registrations(): void
    {
        $a = $this->candidate();
        $student = $this->makeTestStudent(['user_id' => $a->owner_user_id, 'cne' => $a->cne]);
        $a->update(['student_id' => $student->id]);
        $campaign = $a->campaign;
        foreach (['initial' => 1, 're_enrollment' => 3] as $type => $semester) {
            StudentRegistration::create(['student_id' => $student->id,
                'academic_year_id' => $campaign->academic_year_id, 'filiere_id' => $campaign->filiere_id,
                'semester_number' => $semester, 'registration_type' => $type, 'status' => 'academic_validated']);
        }
        $other = $this->makeTestStudent(['cne' => 'Z123456789']);
        StudentRegistration::create(['student_id' => $other->id,
            'academic_year_id' => $campaign->academic_year_id, 'filiere_id' => $campaign->filiere_id,
            'semester_number' => 9, 'registration_type' => 're_enrollment', 'status' => 'academic_validated']);
        $this->login($a);
        $this->getJson(self::BASE.'/dossier')->assertOk()
            ->assertJsonPath('candidate.administrative_context.registration_semesters', [1])
            ->assertJsonCount(1, 'candidate.administrative_context.renewals')
            ->assertJsonPath('candidate.administrative_context.renewals.0.semester', 3);
    }

    public function test_optional_academic_documents_do_not_expand_tafem_requirements(): void
    {
        $a = $this->candidate();
        $this->login($a);
        Storage::fake('private');
        foreach (['attestation_admissibilite', 'diplome', 'licence'] as $type) {
            $this->post(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version,
                'type' => $type, 'file' => UploadedFile::fake()->createWithContent('scan.pdf', '%PDF-1.4 SYNTHETIC')],
                ['Accept' => 'application/json'])->assertOk()->assertJsonPath('candidate.required_documents', ['bac', 'cnie', 'releve_notes', 'photo']);
        }
    }

    public function test_document_versions_preserve_files_and_withdrawn_urls_stop_working(): void
    {
        $a = $this->candidate();
        $this->login($a);
        Storage::fake('private');
        foreach ([1, 2] as $size) {
            $this->post(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version,
                'type' => 'cin', 'file' => UploadedFile::fake()->createWithContent('scan.pdf', '%PDF-1.4 SYNTHETIC VERSION '.$size)], ['Accept' => 'application/json'])->assertOk();
        }
        $docs = StudentDocument::where('application_id', $a->id)->orderBy('id')->get();
        $this->assertCount(2, $docs);
        $this->assertFalse($docs[0]->is_current);
        $this->assertTrue($docs[1]->is_current);
        Storage::disk('private')->assertExists($docs[0]->file_path);
        $url = $this->getJson(self::BASE.'/dossier')->assertOk()->json('candidate.documents.cnie.signed_url');
        $this->deleteJson(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version, 'type' => 'cnie'])->assertOk();
        $this->get($url)->assertNotFound();
        $this->assertDatabaseCount('student_documents', 2);
    }

    public function test_application_only_dossier_contains_only_its_documents(): void
    {
        $a = $this->candidate();
        $b = $this->candidate('Z999999999', 'CD999999');
        StudentDocument::create(['application_id' => $b->id, 'cne' => $b->cne, 'type' => 'bac', 'file_path' => 'other.pdf', 'status' => 'pending']);
        $this->login($a);
        $this->assertEmpty($this->getJson(self::BASE.'/dossier')->assertOk()->json('candidate.documents'));
    }

    public function test_real_submission_review_and_approval_create_one_registration_without_fabricated_number(): void
    {
        Mail::fake();
        $a = $this->candidate();
        $this->login($a);
        $this->documents($a);
        $this->postJson(self::BASE.'/submit', ['application_id' => $a->id, 'version' => $a->fresh()->version])->assertOk()->assertJsonPath('candidate.dossier_status', 'submitted');
        $this->staff('professor');
        $this->postJson(self::BASE.'/decide', ['application_id' => $a->id])->assertForbidden();
        $this->postJson('/api/admin/tafem/verify-physical-dossier', ['student_id' => 1])->assertForbidden();
        $this->staff();
        foreach (StudentDocument::where('application_id', $a->id)->get() as $doc) {
            $this->postJson(self::BASE.'/documents/'.$doc->id.'/review', ['application_id' => $a->id,
                'version' => $a->fresh()->version, 'decision' => 'verified'])->assertOk();
        }
        $payload = ['application_id' => $a->id, 'version' => $a->fresh()->version, 'decision' => 'approved',
            'physical_checklist' => ['bac_original' => true, 'releve_notes' => true, 'cin_copy' => true, 'photos' => true]];
        $this->postJson(self::BASE.'/decide', $payload)->assertUnprocessable();
        $payload['official_number'] = 'OFFICIAL-2026-045';
        $this->postJson(self::BASE.'/decide', $payload)->assertOk()->assertJsonPath('candidate.dossier_status', 'approved');
        $this->postJson(self::BASE.'/decide', $payload)->assertOk();
        $this->assertDatabaseCount('student_registrations', 1);
        $this->assertDatabaseHas('students', ['cne' => $a->cne, 'student_number' => $payload['official_number'], 'status' => 'active']);
        $this->login($a);
        $this->postJson(self::BASE.'/dossier', ['application_id' => $a->id, 'version' => $a->fresh()->version, 'first_name' => 'Late change'])->assertForbidden();
    }

    public function test_import_requires_preview_and_preserves_existing_owner_and_approved_student(): void
    {
        $a = $this->candidate();
        $owner = $a->owner_user_id;
        $this->staff();
        $csv = "cne;cin;first_name;last_name;bac_average;tafem_score;list_type;rank\n{$a->cne};{$a->cin};Synthetic;Candidate;16,63;174,50;liste_principale;1\n";
        $r = $this->post(self::BASE.'/imports/preview', ['campaign_id' => $a->admission_campaign_id,
            'file' => UploadedFile::fake()->createWithContent('official.csv', $csv)], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('can_commit', true);
        $this->assertSame(0, Student::count());
        $this->postJson(self::BASE.'/imports/'.$r->json('id').'/commit')->assertOk()->assertJsonPath('imported', 1);
        $this->assertSame($owner, $a->fresh()->owner_user_id);
        $this->assertEquals(16.63, $a->fresh()->bac_average);
        $this->postJson(self::BASE.'/imports/'.$r->json('id').'/commit')->assertOk()->assertJsonPath('already_committed', true);
        $a->update(['dossier_status' => 'approved']);
        $this->post(self::BASE.'/imports/preview', ['campaign_id' => $a->admission_campaign_id,
            'file' => UploadedFile::fake()->createWithContent('official.csv', $csv)], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('can_commit', false);
    }

    public function test_ocr_requires_consent_and_has_owned_persistent_status(): void
    {
        Queue::fake();
        $a = $this->candidate();
        $this->login($a);
        $this->documents($a);
        $doc = StudentDocument::where('application_id', $a->id)->where('type', 'bac')->firstOrFail();
        $payload = ['application_id' => $a->id, 'document_id' => $doc->id, 'mode' => 'local'];
        $this->postJson(self::BASE.'/ocr', $payload)->assertUnprocessable();
        $r = $this->postJson(self::BASE.'/ocr', $payload + ['consent' => true, 'consent_version' => 'admissions-v1'])->assertAccepted();
        $this->getJson(self::BASE.'/ocr/'.$r->json('id'))->assertOk()->assertJsonPath('status', 'queued');
        Sanctum::actingAs(User::factory()->create(['institution_id' => 1]));
        $this->getJson(self::BASE.'/ocr/'.$r->json('id'))->assertNotFound();
    }

    public function test_appointment_capacity_entry_and_duplicate_check_in_are_real(): void
    {
        $this->travelTo(now()->startOfDay()->addHours(10));
        $a = $this->candidate();
        $this->staff();
        $slot = DB::table('admission_slots')->insertGetId(['admission_campaign_id' => $a->admission_campaign_id,
            'starts_at' => now()->addHour(), 'ends_at' => now()->addHours(2), 'desk' => 'Guichet test', 'capacity' => 1]);
        $this->login($a);
        $this->postJson(self::BASE.'/appointments', ['application_id' => $a->id, 'version' => 1, 'slot_id' => $slot])->assertOk();
        $b = $this->candidate('Z999999999', 'CD999999');
        $this->login($b);
        $this->postJson(self::BASE.'/appointments', ['application_id' => $b->id, 'version' => 1, 'slot_id' => $slot])->assertConflict();
        $token = DB::table('admission_appointments')->where('application_id', $a->id)->value('entry_token');
        $this->staff();
        $this->postJson(self::BASE.'/scan/'.$token.'/check-in')->assertOk();
        $this->postJson(self::BASE.'/scan/'.$token.'/check-in')->assertConflict();
    }

    public function test_activation_uses_only_a_verified_contact_and_token_once(): void
    {
        Queue::fake();
        $a = $this->candidate();
        $a->update(['owner_user_id' => null, 'cin' => 'EF765432', 'email' => 'verified@example.test']);
        $this->staff();
        $this->postJson(self::BASE.'/applications/'.$a->id.'/activation', ['email' => 'verified@example.test', 'contact_verified' => true])->assertOk();
        $token = null;
        Queue::assertPushed(SendAdmissionNotificationJob::class, function ($job) use (&$token) {
            $token = $job->activationToken;

            return $token !== null;
        });
        $payload = ['token' => $token, 'password' => 'SyntheticPassword123!', 'password_confirmation' => 'SyntheticPassword123!'];
        $this->postJson('/api/public/admissions/activate', $payload)->assertOk();
        $this->postJson('/api/public/admissions/activate', $payload)->assertUnprocessable();
        $this->assertNotNull($a->fresh()->owner_user_id);
    }

    public function test_stats_and_waiting_invitations_use_actual_campaign_capacity_and_rank(): void
    {
        Queue::fake();
        $a = $this->candidate();
        $b = $this->candidate('B123456789', 'BC123456');
        $b->update(['eligibility' => 'waiting', 'ranking' => 20]);
        $c = $this->candidate('C123456789', 'CD123456');
        $c->update(['eligibility' => 'waiting', 'ranking' => 10]);
        $this->staff();
        $this->getJson(self::BASE.'/stats?campaign_id='.$a->admission_campaign_id)->assertOk()->assertJsonPath('stats.total_candidates', 3)->assertJsonPath('stats.total_capacity', 2);
        $this->postJson(self::BASE.'/promote', ['campaign_id' => $a->admission_campaign_id, 'limit' => 10])->assertOk()->assertJsonPath('promoted_count', 1);
        $this->assertSame('main', $c->fresh()->eligibility);
        $this->assertSame('waiting', $b->fresh()->eligibility);
        $this->postJson(self::BASE.'/promote', ['campaign_id' => $a->admission_campaign_id, 'limit' => 10])->assertOk()->assertJsonPath('promoted_count', 0);
        $c->update(['invitation_expires_at' => now()->subMinute()]);
        $this->postJson(self::BASE.'/promote', ['campaign_id' => $a->admission_campaign_id, 'limit' => 10])->assertOk()->assertJsonPath('promoted_count', 1);
        $this->assertSame('invitation_expired', $c->fresh()->eligibility);
    }

    public function test_rejected_document_requests_correction_and_preserves_reviewed_version(): void
    {
        Queue::fake();
        $a = $this->candidate();
        $this->login($a);
        $this->documents($a);
        $this->postJson(self::BASE.'/submit', ['application_id' => $a->id, 'version' => $a->fresh()->version])->assertOk();
        $doc = StudentDocument::where('application_id', $a->id)->where('type', 'cnie')->firstOrFail();
        $this->staff();
        $bac = StudentDocument::where('application_id', $a->id)->where('type', 'bac')->firstOrFail();
        $this->postJson(self::BASE.'/documents/'.$bac->id.'/review', ['application_id' => $a->id, 'version' => $a->fresh()->version, 'decision' => 'verified'])->assertOk();
        $this->postJson(self::BASE.'/documents/'.$doc->id.'/review', ['application_id' => $a->id, 'version' => $a->fresh()->version,
            'decision' => 'rejected', 'reason' => 'Verso manquant, merci de remplacer la pièce.'])->assertOk()->assertJsonPath('candidate.dossier_status', 'needs_correction');
        $notes = StudentDocument::where('application_id', $a->id)->where('type', 'releve_notes')->firstOrFail();
        $this->postJson(self::BASE.'/documents/'.$notes->id.'/review', ['application_id' => $a->id, 'version' => $a->fresh()->version, 'decision' => 'rejected', 'reason' => 'Image illisible'])->assertOk()->assertJsonPath('candidate.dossier_status', 'needs_correction');
        $this->login($a);
        $this->deleteJson(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version, 'type' => 'bac'])->assertUnprocessable();
        $this->post(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version, 'type' => 'bac', 'file' => UploadedFile::fake()->createWithContent('new.pdf', '%PDF-1.4 SYNTHETIC REPLACEMENT')], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->assertTrue($bac->fresh()->is_current);
        $this->postJson(self::BASE.'/submit', ['application_id' => $a->id, 'version' => $a->fresh()->version])->assertUnprocessable();
        $this->post(self::BASE.'/documents', ['application_id' => $a->id, 'version' => $a->fresh()->version, 'type' => 'cnie',
            'file' => UploadedFile::fake()->createWithContent('new.pdf', '%PDF-1.4 NEW SYNTHETIC RECTO VERSO')], ['Accept' => 'application/json'])->assertOk();
        $this->assertFalse($doc->fresh()->is_current);
        $this->assertDatabaseHas('admission_reviews', ['document_id' => $doc->id, 'decision' => 'rejected']);
    }

    public function test_real_local_async_ocr_records_a_result_without_any_cloud_call(): void
    {
        Queue::fake();
        Http::preventStrayRequests();
        Storage::fake('private');
        $a = $this->candidate();
        $this->login($a);
        $pdf = app('dompdf.wrapper')->loadHTML('<html><body><h1>SYNTHETIC DOCUMENT</h1><p>CNE N123456789</p><p>CIN AB123456</p></body></html>')->output();
        Storage::disk('private')->put('ocr-test.pdf', $pdf);
        $doc = StudentDocument::create(['application_id' => $a->id, 'cne' => $a->cne, 'type' => 'bac', 'file_path' => 'ocr-test.pdf', 'mime_type' => 'application/pdf', 'status' => 'pending']);
        $r = $this->postJson(self::BASE.'/ocr', ['application_id' => $a->id, 'document_id' => $doc->id, 'mode' => 'local', 'consent' => true, 'consent_version' => 'admissions-v1'])->assertAccepted();
        (new ProcessAdmissionOcrJob($r->json('id')))->handle(app(AdmissionOcrService::class));
        $this->getJson(self::BASE.'/ocr/'.$r->json('id'))->assertOk()->assertJsonPath('status', 'needs_review')->assertJsonPath('fields.cne.value', 'N123456789');
    }

    public function test_unlinked_document_requires_manual_identity_confirmation(): void
    {
        $a = $this->candidate();
        $this->staff();
        $doc = StudentDocument::create(['cne' => 'UNKNOWN', 'type' => 'bac', 'file_path' => 'legacy.pdf', 'status' => 'pending']);
        $this->postJson(self::BASE.'/unlinked-documents/'.$doc->id.'/reconcile', ['application_id' => $a->id, 'version' => 1, 'reason' => 'Original examiné au guichet'])->assertUnprocessable();
        $this->postJson(self::BASE.'/unlinked-documents/'.$doc->id.'/reconcile', ['application_id' => $a->id, 'version' => 1,
            'reason' => 'Original examiné au guichet', 'identity_verified' => true])->assertOk();
        $this->assertSame($a->id, $doc->fresh()->application_id);
    }

    public function test_legacy_academic_validation_cannot_bypass_admission_review(): void
    {
        $a = $this->candidate();
        $s = Student::create(['institution_id' => 1, 'user_id' => $a->owner_user_id, 'cne' => $a->cne,
            'student_number' => 'OFFICIAL-LEGACY-01', 'status' => 'pending', 'gender' => 'female']);
        $a->update(['student_id' => $s->id]);
        $this->staff('admin');
        $this->postJson('/api/academic/candidates/validate', ['student_id' => $s->id, 'filiere_id' => $a->campaign->filiere_id])->assertUnprocessable();
        $this->assertDatabaseCount('student_registrations', 0);
    }

    public function test_cloud_policy_is_admin_controlled_and_mocked_extraction_rejects_invalid_fields(): void
    {
        config(['services.groq.key' => 'synthetic-test-key', 'services.groq.model' => 'synthetic-model', 'services.groq.vision_model' => 'synthetic-model']);
        $a = $this->candidate();
        $this->staff('scolarite');
        $this->putJson(self::BASE.'/ocr-settings', ['cloud_enabled' => true])->assertForbidden();
        $this->staff('admin');
        $this->putJson(self::BASE.'/ocr-settings', ['cloud_enabled' => true])->assertOk()->assertJsonPath('cloud_enabled', true);
        Storage::fake('private');
        $pdf = app('dompdf.wrapper')->loadHTML('<html><body>SYNTHETIC DOCUMENT CNE N123456789 CIN AB123456</body></html>')->output();
        Storage::disk('private')->put('cloud-synthetic.pdf', $pdf);
        $doc = StudentDocument::create(['application_id' => $a->id, 'cne' => $a->cne, 'type' => 'bac', 'file_path' => 'cloud-synthetic.pdf', 'mime_type' => 'application/pdf', 'status' => 'pending']);
        Http::fake(['api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => json_encode(['cne' => 'N123456789', 'cin' => 'AB123456', 'birth_date' => '31/02/2006', 'bac_average' => 99])]]]])]);
        $result = app(AdmissionOcrService::class)->extract($doc->fresh(), 'cloud');
        Http::assertSentCount(1);
        $this->assertArrayNotHasKey('birth_date', $result['fields']);
        $this->assertArrayNotHasKey('bac_average', $result['fields']);
        $this->assertSame('N123456789', $result['fields']['cne']['value']);
    }

    public static function unavailableCloudResponses(): array
    {
        return [
            'timeout or connection failure' => ['connection'],
            'rate limited' => ['429'],
            'provider unavailable' => ['503'],
            'malformed JSON' => ['malformed'],
            'missing completion' => ['missing'],
            'list instead of object' => ['list'],
            'nested values' => ['nested'],
            'null or invalid values' => ['invalid'],
        ];
    }

    public function test_scanned_image_uses_real_local_ocr_without_cloud(): void
    {
        Queue::fake();
        Http::preventStrayRequests();
        Storage::fake('private');
        $a = $this->candidate();
        $this->login($a);
        $disk = Storage::disk('private');
        $disk->put('scan-source.pdf', app('dompdf.wrapper')->loadHTML('<html><body style="font-family:DejaVu Sans;font-size:26px"><p>SYNTHETIC DOCUMENT</p><p>CNE N123456789</p><p>CIN AB123456</p></body></html>')->output());
        $rasterize = new Process(['pdftoppm', '-singlefile', '-r', '150', '-png', $disk->path('scan-source.pdf'), $disk->path('scan-image')]);
        $rasterize->setTimeout(15)->mustRun();
        $doc = StudentDocument::create(['application_id' => $a->id, 'cne' => $a->cne, 'type' => 'bac', 'file_path' => 'scan-image.png', 'mime_type' => 'image/png', 'status' => 'pending']);
        $queued = $this->postJson(self::BASE.'/ocr', ['application_id' => $a->id, 'document_id' => $doc->id,
            'mode' => 'local', 'consent' => true, 'consent_version' => 'admissions-v1'])->assertAccepted();
        (new ProcessAdmissionOcrJob($queued->json('id')))->handle(app(AdmissionOcrService::class));
        $this->getJson(self::BASE.'/ocr/'.$queued->json('id'))->assertOk()->assertJsonPath('status', 'needs_review')
            ->assertJsonPath('engine', 'tesseract')->assertJsonPath('fields.cne.value', 'N123456789')->assertJsonPath('fields.cin.value', 'AB123456');
        Http::assertNothingSent();
    }

    #[DataProvider('unavailableCloudResponses')]
    public function test_cloud_failure_preserves_local_results_through_the_candidate_api(string $failure): void
    {
        Queue::fake();
        Http::preventStrayRequests();
        Storage::fake('private');
        config(['services.groq.key' => 'synthetic-test-key', 'services.groq.model' => 'synthetic-model', 'services.groq.vision_model' => 'synthetic-model']);
        $a = $this->candidate();
        $this->login($a);
        $institution = $a->campaign->institution;
        $settings = $institution->settings ?? [];
        $settings['admissions']['ocr_cloud_enabled'] = true;
        $institution->update(['settings' => $settings]);
        $pdf = app('dompdf.wrapper')->loadHTML('<html><body><h1>SYNTHETIC DOCUMENT</h1><p>CNE N123456789</p><p>CIN AB123456</p></body></html>')->output();
        Storage::disk('private')->put('fallback-synthetic.pdf', $pdf);
        $doc = StudentDocument::create(['application_id' => $a->id, 'cne' => $a->cne, 'type' => 'bac', 'file_path' => 'fallback-synthetic.pdf', 'mime_type' => 'application/pdf', 'status' => 'pending']);
        $service = app(AdmissionOcrService::class);
        $local = $service->extract($doc->fresh(), 'local');
        $this->assertSame('N123456789', $local['fields']['cne']['value']);
        Http::assertNothingSent();
        $attempts = 0;
        Http::fake(['api.groq.com/*' => function () use ($failure, &$attempts) {
            $attempts++;
            if ($failure === 'connection') {
                throw new ConnectionException('SYNTHETIC_PRIVATE_PROVIDER_DETAILS');
            }
            if (in_array($failure, ['429', '503'], true)) {
                return Http::response(['error' => 'SYNTHETIC_PRIVATE_PROVIDER_DETAILS'], (int) $failure);
            }
            if ($failure === 'missing') {
                return Http::response(['choices' => []]);
            }
            $content = match ($failure) {
                'malformed' => '{invalid', 'list' => '["N123456789"]',
                'nested' => '{"cne":{"value":"WRONG"},"first_name_fr":["WRONG"]}',
                default => '{"cne":null,"cin":null,"birth_date":"31/02/2006","bac_average":99}',
            };

            return Http::response(['choices' => [['message' => ['content' => $content]]]]);
        }]);
        $response = $this->postJson(self::BASE.'/ocr', ['application_id' => $a->id, 'document_id' => $doc->id,
            'mode' => 'cloud', 'consent' => true, 'consent_version' => 'admissions-v1'])->assertAccepted();
        (new ProcessAdmissionOcrJob($response->json('id')))->handle($service);
        $result = $this->getJson(self::BASE.'/ocr/'.$response->json('id'))->assertOk()->assertJsonPath('status', 'needs_review');
        $this->assertSame($local['fields'], $result->json('fields'));
        $this->assertSame($local['engine'], $result->json('engine'));
        $this->assertStringContainsString('extraction locale conservée', implode(' ', $result->json('warnings')));
        $this->assertStringNotContainsString('SYNTHETIC_PRIVATE_PROVIDER_DETAILS', $result->getContent());
        $this->assertSame(1, $attempts);
        Http::assertSentCount($failure === 'connection' ? 0 : 1);
    }

    public function test_partial_cloud_enrichment_keeps_local_identifiers_and_document_provenance(): void
    {
        Http::preventStrayRequests();
        Storage::fake('private');
        config(['services.groq.key' => 'synthetic-test-key', 'services.groq.model' => 'synthetic-model', 'services.groq.vision_model' => 'synthetic-model']);
        $a = $this->candidate();
        $institution = $a->campaign->institution;
        $settings = $institution->settings ?? [];
        $settings['admissions']['ocr_cloud_enabled'] = true;
        $institution->update(['settings' => $settings]);
        $pdf = app('dompdf.wrapper')->loadHTML('<html><body><h1>SYNTHETIC DOCUMENT</h1><p>CNE N123456789</p><p>CIN AB123456</p></body></html>')->output();
        Storage::disk('private')->put('partial-synthetic.pdf', $pdf);
        $doc = StudentDocument::create(['application_id' => $a->id, 'cne' => $a->cne, 'type' => 'bac', 'file_path' => 'partial-synthetic.pdf', 'mime_type' => 'application/pdf', 'status' => 'pending']);
        Http::fake(['api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => '{"cne":null,"birth_date":"12/02/2006","bac_average":16.5,"status":"approved"}']]]])]);
        $result = app(AdmissionOcrService::class)->extract($doc->fresh(), 'cloud');
        $this->assertSame('N123456789', $result['fields']['cne']['value']);
        $this->assertSame('AB123456', $result['fields']['cin']['value']);
        $this->assertSame('2006-02-12', $result['fields']['birth_date']['value']);
        $this->assertSame(16.5, $result['fields']['bac_average']['value']);
        $this->assertSame($doc->id, $result['fields']['birth_date']['document_id']);
        $this->assertTrue($result['fields']['birth_date']['requires_confirmation']);
        $this->assertArrayNotHasKey('status', $result['fields']);
        $this->assertStringContainsString('+groq:synthetic-model', $result['engine']);
        Http::assertSentCount(1);
    }
}
