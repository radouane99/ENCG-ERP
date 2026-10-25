<?php

namespace Tests\Feature;

use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Institution;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Services\Core\VerifiedDatabaseBackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class OperationalWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        $user = User::factory()->create(['institution_id' => 1]);
        $user->assignRole(Role::findOrCreate('admin', 'sanctum'));
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    private function requestDocument(): DocumentRequest
    {
        $student = $this->makeTestStudent();
        $type = DocumentType::firstOrCreate(['code' => 'SYNTEST'], ['name' => 'Attestation synthétique', 'view_name' => 'pdf.attestation']);

        return DocumentRequest::create(['student_id' => $student->id, 'document_type_id' => $type->id, 'status' => 'pending', 'requested_at' => now()]);
    }

    public function test_student_only_sees_own_requests_and_no_staff_metrics(): void
    {
        $own = $this->requestDocument();
        $other = $this->requestDocument();
        $user = $own->student->user;
        $user->assignRole(Role::findOrCreate('student', 'sanctum'));
        $data = $this->actingAs($user, 'sanctum')->getJson('/api/workspace/today')->assertOk()->json('data');
        $this->assertFalse($data['staff']);
        $this->assertSame([$own->id], array_column($data['requests'], 'id'));
        $this->assertArrayNotHasKey('quality', $data);
        $this->patchJson('/api/workspace/requests/'.$other->id.'/followup', ['assigned_to' => null, 'due_at' => null, 'revision' => 0, 'reason' => 'Modification non autorisée.'])->assertForbidden();
    }

    public function test_staff_assigns_followup_without_changing_academic_request_and_rejects_stale_write(): void
    {
        $agent = $this->staff();
        $document = $this->requestDocument();
        $payload = ['assigned_to' => $agent->id, 'due_at' => now()->addDay()->toIso8601String(), 'revision' => 0, 'reason' => 'Traitement confié au service scolarité.'];
        $url = '/api/workspace/requests/'.$document->id.'/followup';
        $this->patchJson($url, $payload)->assertOk();
        $this->patchJson($url, $payload)->assertStatus(409);
        $this->assertSame('pending', $document->fresh()->status);
        $this->assertDatabaseHas('operational_request_followups', ['document_request_id' => $document->id, 'assigned_to' => $agent->id, 'version' => 1]);
        $this->assertDatabaseHas('activity_log', ['description' => 'document_followup_assigned']);
        $document->update(['status' => 'ready']);
        $payload['revision'] = 1;
        $this->patchJson($url, $payload)->assertStatus(409);
    }

    public function test_foreign_or_student_assignee_is_rejected(): void
    {
        $this->staff();
        $document = $this->requestDocument();
        $institution = Institution::create(['name' => 'Other', 'code' => 'OTHER', 'slug' => 'other', 'type' => 'grande_ecole']);
        $agent = User::factory()->create(['institution_id' => $institution->id]);
        $payload = ['assigned_to' => $agent->id, 'due_at' => null, 'revision' => 0, 'reason' => 'Attribution de contrôle interétablissement.'];
        $url = '/api/workspace/requests/'.$document->id.'/followup';
        $this->patchJson($url, $payload)->assertNotFound();
        $payload['assigned_to'] = $document->student->user_id;
        $this->patchJson($url, $payload)->assertUnprocessable();
        $this->assertDatabaseCount('operational_request_followups', 0);
    }

    public function test_reminders_are_deduplicated_and_stop_when_request_is_processed(): void
    {
        Mail::fake();
        $agent = $this->staff();
        $document = $this->requestDocument();
        DB::table('operational_request_followups')->insert(['document_request_id' => $document->id, 'assigned_to' => $agent->id, 'due_at' => now()->subHour(), 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $this->artisan('documents:remind-followups')->assertSuccessful();
        $this->artisan('documents:remind-followups')->assertSuccessful();
        $this->assertSame(1, $agent->notifications()->count());
        $document->update(['status' => 'ready']);
        $this->travel(2)->days();
        $this->artisan('documents:remind-followups')->assertSuccessful();
        $this->assertSame(1, $agent->notifications()->count());
        Mail::assertNothingSent();
    }

    public function test_staff_notification_activity_excludes_security_notifications(): void
    {
        $agent = $this->staff();
        $this->makeTestAcademicYear();
        $agent->notify(new SystemNotification('Suivi opérationnel', 'Dossier de test.'));
        DB::table('notifications')->insert(['id' => (string) Str::uuid(), 'type' => 'SecuritySecret', 'notifiable_type' => User::class, 'notifiable_id' => $agent->id, 'data' => json_encode(['title' => 'SECRET']), 'created_at' => now(), 'updated_at' => now()]);
        $response = $this->getJson('/api/workspace/today')->assertOk();
        $this->assertCount(1, $response->json('data.notification_activity'));
        $this->assertSame('Suivi opérationnel', $response->json('data.notification_activity.0.data.title'));
    }

    public function test_restore_probe_refuses_source_database_before_starting_a_process(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        app(VerifiedDatabaseBackupService::class)->verifyRestore('encg_20261025_123456_abcdef12.dump', 'encg_erp');
    }
}
