<?php

namespace Tests\Feature;

use App\Models\ContactSubmission;
use App\Models\Institution;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PublicPortalContentTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $actor = User::factory()->create(['institution_id' => 1, 'is_active' => true, 'must_change_password' => false]);
        $actor->assignRole(Role::findOrCreate('institution-admin', 'sanctum'));
        Sanctum::actingAs($actor);

        return $actor;
    }

    private function payload(): array
    {
        return ['revision' => 0, 'hours' => 'Synthetic hours', 'guides' => ['tafem' => ['instructions' => 'TAFEM instructions'], 'cnaem' => ['instructions' => 'CNAEM instructions']],
            'announcements' => [['title' => 'Official synthetic notice', 'body' => 'Synthetic official information', 'status' => 'published', 'starts_on' => '2026-11-01', 'ends_on' => '2026-11-10']]];
    }

    public function test_guides_share_required_documents_and_public_contact_never_leaks_settings(): void
    {
        $institution = Institution::findOrFail(1);
        $institution->update(['email' => 'official@example.test', 'settings' => ['secret_setting' => 'NEVER_PUBLIC', 'admissions' => ['ocr_cloud_enabled' => true]]]);
        $this->getJson('/api/public/admissions/portal')->assertOk()->assertJsonPath('data.contact.email', 'official@example.test')->assertJsonPath('data.guides.cnaem.documents.4', 'attestation_admission')->assertJsonMissing(['secret_setting' => 'NEVER_PUBLIC']);
    }

    public function test_publication_obeys_dates_and_archiving_without_modifying_admission_dates(): void
    {
        $this->admin();
        $payload = $this->payload();
        $saved = $this->putJson('/api/admin/public-portal', $payload)->assertOk()->assertJsonPath('data.revision', 1);
        $this->travelTo(CarbonImmutable::parse('2026-10-31 23:59:59', 'Africa/Casablanca'));
        $this->getJson('/api/public/admissions/portal')->assertJsonCount(0, 'data.announcements');
        $this->travelTo(CarbonImmutable::parse('2026-11-01 00:00:00', 'Africa/Casablanca'));
        $this->getJson('/api/public/admissions/portal')->assertJsonCount(1, 'data.announcements');
        $this->travelTo(CarbonImmutable::parse('2026-11-11 00:00:00', 'Africa/Casablanca'));
        $this->getJson('/api/public/admissions/portal')->assertJsonCount(0, 'data.announcements');
        $this->travelTo(CarbonImmutable::parse('2026-11-05 12:00:00', 'Africa/Casablanca'));
        $payload['revision'] = 1;
        $payload['announcements'][0]['id'] = $saved->json('data.announcements.0.id');
        $payload['announcements'][0]['status'] = 'archived';
        $this->putJson('/api/admin/public-portal', $payload)->assertOk();
        $this->getJson('/api/public/admissions/portal')->assertJsonCount(0, 'data.announcements');
    }

    public function test_concurrent_edits_are_rejected_and_unknown_pdfs_cannot_be_linked(): void
    {
        $this->admin();
        $payload = $this->payload();
        $this->putJson('/api/admin/public-portal', $payload)->assertOk();
        $this->putJson('/api/admin/public-portal', $payload)->assertStatus(409);
        $payload['revision'] = 1;
        $payload['announcements'][0]['attachment_id'] = 'd970b8d5-d586-4d13-9838-09b73f711192';
        $this->putJson('/api/admin/public-portal', $payload)->assertStatus(422);
    }

    public function test_pdf_is_private_until_its_announcement_is_visible_and_expires_with_it(): void
    {
        Storage::fake('private');
        $this->admin();
        $pdf = UploadedFile::fake()->createWithContent('official.pdf', "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF");
        $uploaded = $this->postJson('/api/admin/public-portal/attachments', ['file' => $pdf])->assertCreated();
        $id = $uploaded->json('id');
        $this->get('/api/admin/public-portal/attachments/'.$id)->assertOk()->assertDownload('communique-'.$id.'.pdf');
        $url = '/api/public/admissions/announcements/'.$id.'/pdf';
        $this->get($url)->assertNotFound();
        $payload = $this->payload();
        $payload['announcements'][0]['attachment_id'] = $id;
        $this->putJson('/api/admin/public-portal', $payload)->assertOk();
        $this->travelTo(CarbonImmutable::parse('2026-11-05', 'Africa/Casablanca'));
        $this->get($url)->assertOk()->assertDownload('communique-'.$id.'.pdf');
        $path = Institution::findOrFail(1)->settings['public_portal']['attachments'][$id]['path'];
        $original = Storage::disk('private')->get($path);
        Storage::disk('private')->put($path, 'tampered content');
        $this->get($url)->assertStatus(409);
        Storage::disk('private')->put($path, $original);
        $this->travelTo(CarbonImmutable::parse('2026-11-11', 'Africa/Casablanca'));
        $this->get($url)->assertNotFound();
    }

    public function test_student_cannot_publish_or_upload_and_invalid_dates_are_rejected(): void
    {
        $student = User::factory()->create(['is_active' => true, 'institution_id' => 1]);
        $student->assignRole(Role::findOrCreate('student', 'sanctum'));
        Sanctum::actingAs($student);
        $this->putJson('/api/admin/public-portal', $this->payload())->assertForbidden();
        $this->postJson('/api/admin/public-portal/attachments', [])->assertForbidden();
        $this->admin();
        $payload = $this->payload();
        $payload['announcements'][0]['ends_on'] = '2026-10-01';
        $this->putJson('/api/admin/public-portal', $payload)->assertStatus(422);
    }

    public function test_public_help_is_routed_persisted_and_scoped_without_accepting_client_routing(): void
    {
        $response = $this->postJson('/api/contact', ['name' => 'Synthetic', 'email' => 'person@example.test', 'subject' => 'documents', 'message' => 'Synthetic document issue', 'institution_id' => 999, 'department' => 'technical'])->assertOk()->assertJsonPath('department', 'admissions');
        $this->assertStringStartsWith('DEM-', $response->json('reference'));
        $this->assertDatabaseHas('contact_submissions', ['institution_id' => 1, 'department' => 'admissions', 'email' => 'person@example.test']);
        $this->admin();
        $listing = $this->getJson('/api/admin/public-support?department=admissions&status=new')->assertOk()->assertJsonCount(1, 'data');
        $this->patchJson('/api/admin/public-support/'.$listing->json('data.0.id'), ['status' => 'closed'])->assertOk();
        $this->getJson('/api/admin/public-support?status=new')->assertJsonCount(0, 'data');
    }

    public function test_support_and_public_settings_do_not_cross_institution_boundaries(): void
    {
        $other = Institution::create(['name' => 'Other', 'code' => 'OTHER', 'slug' => 'other', 'type' => 'grande_ecole']);
        $other->update(['settings' => ['public_portal' => ['announcements' => [['id' => 'hidden', 'title' => 'OTHER PRIVATE', 'body' => 'secret', 'status' => 'published', 'starts_on' => '2020-01-01', 'ends_on' => '2099-01-01']]]]]);
        $row = ContactSubmission::create(['institution_id' => $other->id, 'name' => 'Other', 'email' => 'other@example.test', 'message' => 'private', 'department' => 'general', 'status' => 'new']);
        $this->getJson('/api/public/admissions/portal')->assertJsonMissing(['title' => 'OTHER PRIVATE']);
        $this->admin();
        $this->getJson('/api/admin/public-support')->assertJsonCount(0, 'data');
        $this->patchJson('/api/admin/public-support/'.$row->id, ['status' => 'closed'])->assertNotFound();
    }

    public function test_draft_can_be_prepared_without_dates_but_publication_requires_them(): void
    {
        $this->admin();
        $payload = $this->payload();
        $payload['announcements'][0]['status'] = 'draft';
        $payload['announcements'][0]['starts_on'] = null;
        $payload['announcements'][0]['ends_on'] = null;
        $this->putJson('/api/admin/public-portal', $payload)->assertOk()->assertJsonPath('data.announcements.0.starts_on', '');
        $this->getJson('/api/public/admissions/portal')->assertJsonCount(0, 'data.announcements');
        $payload['revision'] = 1;
        $payload['announcements'][0]['status'] = 'published';
        $this->putJson('/api/admin/public-portal', $payload)->assertStatus(422);
    }

    public function test_storage_failure_does_not_create_a_false_pdf_reference(): void
    {
        $this->admin();
        $disk = \Mockery::mock(FilesystemAdapter::class);
        $disk->shouldReceive('putFileAs')->once()->andReturn(false);
        Storage::shouldReceive('disk')->with('private')->andReturn($disk);
        $pdf = UploadedFile::fake()->createWithContent('official.pdf', "%PDF-1.4\n%%EOF");
        $this->postJson('/api/admin/public-portal/attachments', ['file' => $pdf])->assertStatus(503);
        $this->assertEmpty(Institution::findOrFail(1)->settings['public_portal']['attachments'] ?? []);
    }
}
