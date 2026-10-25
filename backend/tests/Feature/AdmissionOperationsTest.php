<?php

namespace Tests\Feature;

use App\Jobs\ProcessAdmissionOcrJob;
use App\Jobs\SendAdmissionNotificationJob;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Institution;
use App\Models\StudentDocument;
use App\Models\User;
use App\Services\Ocr\AdmissionOcrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdmissionOperationsTest extends TestCase
{
    use RefreshDatabase;

    private const BASE = '/api/admissions/workflow';

    private function actor(string $role = 'scolarite', int $institution = 1): User
    {
        $user = User::factory()->create(['institution_id' => $institution]);
        $user->assignRole(Role::findOrCreate($role, 'sanctum'));
        Sanctum::actingAs($user);

        return $user;
    }

    private function dossier(): Application
    {
        $year = $this->makeTestAcademicYear();
        $filiere = $this->makeTestFiliere();
        $owner = $this->actor('student');
        $campaign = AdmissionCampaign::create(['institution_id' => 1, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id, 'name' => 'Synthetic operations', 'status' => 'open', 'open_date' => now()->subDay(), 'close_date' => now()->addMonth(), 'target_capacity' => 10]);

        return Application::create(['admission_campaign_id' => $campaign->id, 'reference_number' => 'SYN-'.Str::uuid(), 'owner_user_id' => $owner->id, 'cne' => 'N123456789', 'cin' => 'AB123456', 'first_name' => 'Sara', 'last_name' => 'Synthetic', 'email' => $owner->email, 'status' => 'pending', 'dossier_status' => 'submitted', 'eligibility' => 'main', 'submitted_at' => now(), 'profile' => ['birth_date' => '2006-02-12']]);
    }

    private function document(Application $app, string $type = 'bac'): StudentDocument
    {
        return StudentDocument::create(['application_id' => $app->id, 'cne' => $app->cne, 'type' => $type, 'file_path' => 'synthetic.pdf', 'mime_type' => 'application/pdf', 'status' => 'verified']);
    }

    public function test_desk_arrival_is_idempotent_private_and_claims_protect_real_dossier_writes(): void
    {
        Queue::fake();
        $app = $this->dossier();
        $doc = $this->document($app);
        $agent = $this->actor();
        $payload = ['application_id' => $app->id, 'desk' => 'Guichet A'];
        $ticket = $this->postJson(self::BASE.'/operations/desk', $payload)->assertOk()->assertJsonPath('number', 1)->json();
        $this->postJson(self::BASE.'/operations/desk', $payload)->assertOk()->assertJsonPath('id', $ticket['id']);
        $url = self::BASE.'/operations/desk/'.$ticket['id'];
        $this->postJson($url, ['event' => 'claim', 'version' => 1])->assertOk()->assertJsonPath('status', 'serving');
        $other = $this->actor();
        $this->postJson($url, ['event' => 'claim', 'version' => 1])->assertConflict();
        $this->postJson($url, ['event' => 'release', 'version' => 2])->assertConflict();
        $this->postJson(self::BASE.'/documents/'.$doc->id.'/review', ['application_id' => $app->id, 'version' => $app->fresh()->version, 'decision' => 'verified'])->assertConflict();
        $this->postJson(self::BASE.'/operations/originals', ['application_id' => $app->id, 'operation_id' => (string) Str::uuid(), 'document_type' => 'bac', 'event' => 'received', 'storage_location' => 'A1', 'note' => 'Vérification titulaire'])->assertConflict();
        Sanctum::actingAs($agent);
        $this->postJson($url, ['event' => 'release', 'version' => 2])->assertOk()->assertJsonPath('status', 'waiting');
        Sanctum::actingAs($other);
        $this->postJson($url, ['event' => 'claim', 'version' => 3])->assertOk();
        $this->postJson($url, ['event' => 'complete', 'version' => 4])->assertOk()->assertJsonPath('status', 'done');
        $this->assertSame('submitted', $app->fresh()->dossier_status);
        Sanctum::actingAs(User::findOrFail($app->owner_user_id));
        $this->getJson(self::BASE.'/operations/context?application_id='.$app->id)->assertOk()->assertJsonPath('desk_ticket.number', 1);
        $this->getJson(self::BASE.'/operations/desk?campaign_id='.$app->admission_campaign_id)->assertForbidden();
        $this->postJson(self::BASE.'/operations/desk', $payload)->assertForbidden();
    }

    public function test_agent_cannot_claim_two_files_and_foreign_institution_cannot_access_queue(): void
    {
        $app = $this->dossier();
        $second = $this->dossier();
        $agent = $this->actor();
        $first = $this->postJson(self::BASE.'/operations/desk', ['application_id' => $app->id, 'desk' => 'A'])->assertOk()->json('id');
        $next = $this->postJson(self::BASE.'/operations/desk', ['application_id' => $second->id, 'desk' => 'A'])->assertOk()->json('id');
        $this->postJson(self::BASE.'/operations/desk/'.$first, ['event' => 'claim', 'version' => 1])->assertOk();
        $this->postJson(self::BASE.'/operations/desk/'.$next, ['event' => 'claim', 'version' => 1])->assertConflict();
        $foreign = Institution::create(['name' => 'Synthetic foreign institution', 'code' => 'SYN-2', 'slug' => 'synthetic-foreign']);
        $this->actor('scolarite', $foreign->id);
        $this->getJson(self::BASE.'/operations/desk?campaign_id='.$app->admission_campaign_id)->assertForbidden();
        $this->postJson(self::BASE.'/operations/desk/'.$first, ['event' => 'complete', 'version' => 2])->assertForbidden();
        $this->actor('admin');
        $this->postJson(self::BASE.'/operations/desk/'.$first, ['event' => 'release', 'version' => 2])->assertUnprocessable();
        $this->postJson(self::BASE.'/operations/desk/'.$first, ['event' => 'release', 'version' => 2, 'reason' => 'Agent absent, reprise par le responsable'])->assertOk()->assertJsonPath('status', 'waiting');
    }

    private function ocrRun(Application $app, StudentDocument $doc, array $fields = [], string $status = 'needs_review'): string
    {
        $id = (string) Str::uuid();
        DB::table('admission_ocr_runs')->insert(['id' => $id, 'application_id' => $app->id, 'document_id' => $doc->id, 'status' => $status, 'mode' => 'local', 'parser_version' => 'admissions-v1', 'fields' => json_encode($fields), 'created_at' => now(), 'updated_at' => now()]);

        return $id;
    }

    public function test_conflicts_compare_current_documents_and_never_change_identity(): void
    {
        $app = $this->dossier();
        $doc = $this->document($app);
        $this->ocrRun($app, $doc, ['cne' => ['value' => 'Z999999999'], 'last_name_fr' => ['value' => 'Other']]);
        $data = $this->getJson(self::BASE.'/operations/context?application_id='.$app->id)->assertOk()->json('alerts');
        $this->assertSame(['cne', 'last_name_fr'], array_column($data, 'field'));
        $this->assertSame('N123456789', $app->fresh()->cne);
        $doc->update(['is_current' => false]);
        $this->getJson(self::BASE.'/operations/context?application_id='.$app->id)->assertOk()->assertJsonCount(0, 'alerts');
        $this->actor('student');
        $this->getJson(self::BASE.'/operations/context?application_id='.$app->id)->assertNotFound();
    }

    public function test_assignment_is_scoped_versioned_and_available_in_personal_queue(): void
    {
        $app = $this->dossier();
        $agent = $this->actor();
        $payload = ['application_id' => $app->id, 'assigned_to' => $agent->id, 'next_action' => 'Comparer les originaux', 'due_on' => now()->subDay()->toDateString(), 'version' => 0];
        $this->putJson(self::BASE.'/operations/work', $payload)->assertOk()->assertJsonPath('work.version', 1);
        $this->putJson(self::BASE.'/operations/work', $payload)->assertConflict();
        $this->getJson(self::BASE.'/operations/queue?campaign_id='.$app->admission_campaign_id.'&filter=mine')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.next_action', 'Comparer les originaux');
        $this->getJson(self::BASE.'/operations/queue?campaign_id='.$app->admission_campaign_id.'&filter=overdue')->assertOk()->assertJsonPath('total', 1);
        $student = $this->actor('student');
        Sanctum::actingAs($agent);
        $this->putJson(self::BASE.'/operations/work', array_merge($payload, ['version' => 1, 'assigned_to' => $student->id]))->assertUnprocessable();
        Sanctum::actingAs($student);
        $this->putJson(self::BASE.'/operations/work', $payload)->assertForbidden();
    }

    public function test_cross_document_birth_date_conflict_is_reported_without_false_name_conflicts(): void
    {
        $app = $this->dossier();
        $app->update(['profile' => []]);
        $this->ocrRun($app, $this->document($app, 'bac'), ['first_name_fr' => ['value' => 'Sára'], 'birth_date' => ['value' => '2006-02-12']]);
        $this->ocrRun($app, $this->document($app, 'cnie'), ['first_name_fr' => ['value' => ' SARA '], 'birth_date' => ['value' => '2007-02-12']]);
        $r = $this->getJson(self::BASE.'/operations/context?application_id='.$app->id)->assertOk()->assertJsonCount(1, 'alerts')->assertJsonPath('alerts.0.field', 'birth_date');
        $this->assertCount(2, $r->json('alerts.0.sources'));
        $this->assertSame([], $app->fresh()->profile);
    }

    public function test_physical_queue_requires_every_current_document_to_be_verified(): void
    {
        $app = $this->dossier();
        $this->actor();
        foreach (['bac', 'cnie', 'photo'] as $type) {
            $this->document($app, $type);
        }
        $url = self::BASE.'/operations/queue?campaign_id='.$app->admission_campaign_id.'&filter=physical_ready';
        $this->getJson($url)->assertOk()->assertJsonPath('total', 0);
        $this->document($app, 'releve_notes');
        $this->getJson($url)->assertOk()->assertJsonPath('total', 1);
    }

    public function test_originals_are_append_only_idempotent_and_private(): void
    {
        $app = $this->dossier();
        $agent = $this->actor();
        $payload = ['application_id' => $app->id, 'operation_id' => (string) Str::uuid(), 'document_type' => 'bac', 'event' => 'received', 'storage_location' => 'Armoire privée A', 'note' => 'Original remis par le titulaire'];
        $id = $this->postJson(self::BASE.'/operations/originals', $payload)->assertOk()->json('id');
        $this->postJson(self::BASE.'/operations/originals', $payload)->assertOk()->assertJsonPath('id', $id);
        $this->postJson(self::BASE.'/operations/originals', array_merge($payload, ['operation_id' => (string) Str::uuid()]))->assertConflict();
        $this->postJson(self::BASE.'/operations/originals', array_merge($payload, ['operation_id' => (string) Str::uuid(), 'event' => 'returned', 'storage_location' => null, 'note' => 'Identité vérifiée au guichet']))->assertOk();
        $this->assertDatabaseCount('admission_original_events', 2);
        Sanctum::actingAs(User::findOrFail($app->owner_user_id));
        $result = $this->getJson(self::BASE.'/operations/context?application_id='.$app->id)->assertOk()->assertJsonCount(2, 'originals');
        $this->assertStringNotContainsString('Armoire privée', $result->getContent());
        $this->assertNull($result->json('work'));
        $this->get(self::BASE.'/operations/originals/'.$id.'/receipt')->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->actor('student');
        $this->get(self::BASE.'/operations/originals/'.$id.'/receipt')->assertNotFound();
        $this->actor('professor');
        $this->postJson(self::BASE.'/operations/originals', $payload)->assertForbidden();
        $this->assertDatabaseHas('admission_original_events', ['id' => $id, 'recorded_by' => $agent->id, 'event' => 'received']);
    }

    public function test_ocr_retry_creates_one_local_job_and_rejects_duplicate_or_foreign_requests(): void
    {
        Queue::fake();
        $app = $this->dossier();
        $doc = $this->document($app);
        $id = $this->ocrRun($app, $doc, [], 'failed');
        $this->actor();
        $this->getJson(self::BASE.'/operations/monitor?campaign_id='.$app->admission_campaign_id)->assertOk()->assertJsonCount(1, 'ocr');
        $this->postJson(self::BASE.'/operations/ocr/'.$id.'/retry')->assertAccepted();
        $this->postJson(self::BASE.'/operations/ocr/'.$id.'/retry')->assertConflict();
        $job = new ProcessAdmissionOcrJob($id);
        $engine = \Mockery::mock(AdmissionOcrService::class);
        $engine->shouldNotReceive('extract');
        $job->handle($engine);
        $job->failed(new \RuntimeException('Synthetic late failure'));
        $this->assertDatabaseHas('admission_ocr_runs', ['id' => $id, 'status' => 'retried']);
        $this->assertSame(1, DB::table('admission_ocr_runs')->where('status', 'queued')->where('mode', 'local')->count());
        Queue::assertPushed(ProcessAdmissionOcrJob::class, 1);
        Institution::forceCreate(['id' => 2, 'name' => 'Other institution', 'code' => 'OTHER', 'slug' => 'other']);
        $this->actor('scolarite', 2);
        $this->postJson(self::BASE.'/operations/ocr/'.$id.'/retry')->assertForbidden();
        $this->getJson(self::BASE.'/operations/monitor?campaign_id='.$app->admission_campaign_id)->assertForbidden();
    }

    public function test_notification_retry_preserves_history_and_does_not_duplicate_dispatch(): void
    {
        Queue::fake();
        Mail::fake();
        $app = $this->dossier();
        $this->actor();
        $id = DB::table('admission_notifications')->insertGetId(['application_id' => $app->id, 'type' => 'status_update', 'recipient' => $app->email, 'status' => 'failed', 'attempts' => 3, 'created_at' => now(), 'updated_at' => now()]);
        $this->postJson(self::BASE.'/notifications/'.$id.'/retry')->assertOk();
        $this->postJson(self::BASE.'/notifications/'.$id.'/retry')->assertUnprocessable();
        $oldJob = new SendAdmissionNotificationJob($id);
        $oldJob->handle();
        $oldJob->failed(new \RuntimeException('Synthetic late failure'));
        $this->assertDatabaseHas('admission_notifications', ['id' => $id, 'status' => 'retried', 'attempts' => 3]);
        $this->assertSame(1, DB::table('admission_notifications')->where('status', 'queued')->count());
        Queue::assertPushed(SendAdmissionNotificationJob::class, 1);
        Mail::assertNothingSent();
    }
}
