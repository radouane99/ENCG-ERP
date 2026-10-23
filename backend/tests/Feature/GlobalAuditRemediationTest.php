<?php

namespace Tests\Feature;

use App\Actions\Exam\StoreBulkGradesAction;
use App\Exceptions\OptimisticLockException;
use App\Models\AdmissionCampaign;
use App\Models\Assessment;
use App\Models\Conversation;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Institution;
use App\Models\Message;
use App\Models\StudentPathway;
use App\Models\User;
use App\Support\AuditPayload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class GlobalAuditRemediationTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        Role::findOrCreate($role, 'sanctum');
        $user = User::factory()->create(['institution_id' => 1]);
        $user->assignRole($role);

        return $user;
    }

    public function test_public_registration_cannot_replace_existing_student_credentials(): void
    {
        $victim = $this->userWithRole('student');
        $student = $this->makeTestStudent(['user' => $victim]);
        $original = $victim->password;
        $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Intrus', 'last_name' => 'Test', 'email' => $victim->email,
            'cne' => $student->cne, 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!',
        ])->assertUnprocessable();
        $this->assertSame($original, $victim->fresh()->password);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_public_registration_cannot_claim_student_using_another_email(): void
    {
        $student = $this->makeTestStudent();
        $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Intrus', 'last_name' => 'Test', 'email' => 'other@example.test',
            'cne' => $student->cne, 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!',
        ])->assertUnprocessable();
        $this->assertDatabaseMissing('users', ['email' => 'other@example.test']);
    }

    public function test_student_cannot_change_official_dates(): void
    {
        Sanctum::actingAs($this->userWithRole('student'));
        $this->postJson('/api/timetable/dates-config', ['cours_start' => '16/09/2026', 'td_tp_start' => '23/09/2026'])->assertForbidden();
    }

    public function test_dates_are_validated_durable_and_survive_cache_clear(): void
    {
        $this->ensureAcademicYear()->update(['is_current' => true, 'institution_id' => 1]);
        Sanctum::actingAs($this->userWithRole('institution-admin'));
        $dates = ['cours_start' => '16/09/2026', 'td_tp_start' => '23/09/2026'];
        $this->postJson('/api/timetable/dates-config', $dates)->assertOk();
        Cache::flush();
        $this->getJson('/api/timetable/dates-config')->assertOk()->assertJsonPath('data.cours_start', $dates['cours_start']);
        $this->postJson('/api/timetable/dates-config', ['cours_start' => 'arbitrary', 'td_tp_start' => 'invalid'])->assertUnprocessable();
    }

    public function test_classroom_endpoint_only_returns_authorized_group_messages(): void
    {
        $year = $this->ensureAcademicYear();
        $filiere = $this->makeTestFiliere();
        $module = $this->makeTestModule($filiere->id);
        $group = Group::create(['filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'semester_number' => 1, 'name' => 'G1', 'capacity' => 50]);
        $student = $this->makeTestStudent(['user' => $this->userWithRole('student')]);
        StudentPathway::create(['student_id' => $student->id, 'filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'group_id' => $group->id, 'current_semester' => 1, 'is_current' => true]);
        $own = Conversation::create(['institution_id' => 1, 'type' => 'group', 'name' => "Classroom-Group-{$group->id}-Module-{$module->id}"]);
        $other = Conversation::create(['institution_id' => 1, 'type' => 'private', 'name' => 'Unrelated']);
        Message::create(['conversation_id' => $own->id, 'sender_id' => $student->user_id, 'body' => 'Visible']);
        Message::create(['conversation_id' => $other->id, 'sender_id' => $student->user_id, 'body' => 'Private']);
        Sanctum::actingAs($student->user);
        $this->assertSame(1, (int) $student->user->institution_id);
        $this->assertTrue($student->pathways()->where('is_current', true)->exists());
        $response = $this->getJson("/api/classroom/chat/{$group->id}/{$module->id}/messages");
        $this->assertSame(200, $response->status(), $response->getContent());
        $response->assertJsonCount(1, 'data')->assertJsonPath('data.0.text', 'Visible');
        Sanctum::actingAs($this->userWithRole('student'));
        $this->getJson("/api/classroom/chat/{$group->id}/{$module->id}/messages")->assertForbidden();
    }

    public function test_stale_model_cannot_overwrite_grade_without_version_in_payload(): void
    {
        $student = $this->makeTestStudent();
        $module = $this->makeTestModule($this->makeTestFiliere()->id);
        $assessment = $this->createTestAssessment(['module_id' => $module->id, 'type' => 'CC1', 'weight' => 100]);
        $grade = Grade::create(['student_id' => $student->id, 'assessment_id' => $assessment->id, 'value' => 10, 'version' => 1]);
        $first = Grade::findOrFail($grade->id);
        $stale = Grade::findOrFail($grade->id);
        $first->update(['value' => 15]);
        try {
            $stale->update(['value' => 5]);
            $this->fail('A stale writer must be rejected.');
        } catch (OptimisticLockException) {
            $this->assertSame(15.0, $grade->fresh()->value);
            $this->assertEquals(2, $grade->fresh()->version);
        }
    }

    public function test_authentication_preserves_angle_brackets_in_password(): void
    {
        $password = 'P<a>ssword123!';
        $user = User::factory()->create(['password' => Hash::make($password)]);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => $password])->assertOk();
    }

    public function test_audit_payload_redacts_nested_secrets_and_medical_data(): void
    {
        $result = AuditPayload::redact(['nested' => ['code' => '123456', 'medication_used' => 'private'], 'status' => 'pending']);
        $this->assertSame('[REDACTED]', $result['nested']['code']);
        $this->assertSame('[REDACTED]', $result['nested']['medication_used']);
        $this->assertSame('pending', $result['status']);
    }

    public function test_new_registration_uses_an_open_campaign_and_creates_only_a_student_account(): void
    {
        $year = $this->makeTestAcademicYear(['is_current' => true]);
        $filiere = $this->makeTestFiliere();
        AdmissionCampaign::create([
            'institution_id' => 1, 'academic_year_id' => $year->id, 'filiere_id' => $filiere->id,
            'name' => 'Test campaign', 'status' => 'open', 'open_date' => now()->subDay(),
            'close_date' => now()->addMonth(), 'target_capacity' => 50,
        ]);
        $this->postJson('/api/v1/auth/register', [
            'first_name' => 'New', 'last_name' => 'Candidate', 'email' => 'new@example.test', 'cne' => 'N123450001',
            'password' => 'StrongPassword123!', 'password_confirmation' => 'StrongPassword123!', 'role' => 'super-admin',
        ])->assertOk();
        $user = User::where('email', 'new@example.test')->firstOrFail();
        $this->assertEquals(1, $user->institution_id);
        $this->assertTrue($user->hasRole('student'));
        $this->assertFalse($user->hasRole('super-admin'));
    }

    public function test_grade_bulk_update_rejects_stale_client_version_and_keeps_the_saved_value(): void
    {
        $student = $this->makeTestStudent();
        $module = $this->makeTestModule($this->makeTestFiliere()->id);
        $assessment = $this->createTestAssessment(['module_id' => $module->id, 'type' => 'CC1', 'weight' => 100]);
        $grade = Grade::create(['student_id' => $student->id, 'assessment_id' => $assessment->id, 'value' => 10]);
        $action = app(StoreBulkGradesAction::class);
        $action->execute($assessment, [['student_id' => $student->id, 'value' => 15, 'version' => 1]], [], fn () => null);
        try {
            $action->execute($assessment, [['student_id' => $student->id, 'value' => 5, 'version' => 1]], [], fn () => null);
            $this->fail('A stale client version must be rejected.');
        } catch (OptimisticLockException) {
            $this->assertSame(15.0, $grade->fresh()->value);
        }
    }

    public function test_other_institution_cannot_access_this_single_institution_instance(): void
    {
        $other = Institution::create(['name' => 'Other', 'code' => 'OTHER', 'slug' => 'other']);
        $user = $this->userWithRole('student');
        $user->update(['institution_id' => $other->id]);
        Sanctum::actingAs($user);
        $this->getJson('/api/notifications')->assertForbidden();
    }
}
