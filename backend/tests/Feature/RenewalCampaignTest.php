<?php

namespace Tests\Feature;

use App\Models\RenewalCampaign;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RenewalCampaignTest extends TestCase
{
    use RefreshDatabase;

    private function context(): array
    {
        Mail::fake();
        Notification::fake();
        $year = $this->makeTestAcademicYear();
        $f = $this->makeTestFiliere();
        $student = $this->makeTestStudent();
        $student->user->assignRole(Role::findOrCreate('student', 'sanctum'));
        StudentPathway::create(['student_id' => $student->id, 'filiere_id' => $f->id, 'academic_year_id' => $year->id, 'current_semester' => 3, 'is_current' => true]);
        StudentRegistration::create(['student_id' => $student->id, 'filiere_id' => $f->id, 'academic_year_id' => $year->id, 'semester_number' => 3, 'registration_type' => 're_enrollment', 'status' => 'academic_validated']);
        $staff = User::factory()->create(['institution_id' => 1]);
        $staff->assignRole(Role::findOrCreate('scolarite', 'sanctum'));

        return [$year, $student, $staff];
    }

    private function contact(): array
    {
        return ['phone' => '0612345678', 'address' => 'Adresse synthétique', 'city' => 'Fès'];
    }

    private function settings(): array
    {
        return ['version' => 0, 'status' => 'open', 'opens_on' => '2026-10-24', 'closes_on' => '2026-10-24', 'public_message' => 'Présenter les pièces au guichet.'];
    }

    public function test_unconfigured_campaign_blocks_browser_flags_and_real_confirmation(): void
    {
        [, $student] = $this->context();
        Sanctum::actingAs($student->user);
        $this->getJson('/api/student-portal/reinscription/status')->assertOk()->assertJsonPath('data.campaign.state', 'unconfigured')->assertJsonPath('data.can_confirm', false);
        $this->postJson('/api/student-portal/reinscription/confirm', $this->contact() + ['campaign_open' => true])->assertUnprocessable();
        $this->assertDatabaseCount('student_renewals', 0);
    }

    public function test_opening_and_closing_are_inclusive_in_moroccan_time_and_receipt_survives_closure(): void
    {
        [$year, $student, $staff] = $this->context();
        $this->travelTo(Carbon::parse('2026-10-24 00:00:00', 'Africa/Casablanca'));
        Sanctum::actingAs($staff);
        $this->putJson('/api/admin/reinscriptions/campaign', $this->settings())->assertOk()->assertJsonPath('data.state', 'open')->assertJsonPath('data.version', 1);
        $this->travelTo(Carbon::parse('2026-10-24 23:59:59', 'Africa/Casablanca'));
        Sanctum::actingAs($student->user);
        $this->getJson('/api/student-portal/reinscription/status')->assertOk()->assertJsonPath('data.can_confirm', true)->assertJsonPath('data.payment_required', false);
        $receipt = $this->postJson('/api/student-portal/reinscription/confirm', $this->contact())->assertOk()->json('receipt_reference');
        $this->travelTo(Carbon::parse('2026-10-25 00:00:00', 'Africa/Casablanca'));
        $this->getJson('/api/student-portal/reinscription/status')->assertOk()->assertJsonPath('data.campaign.state', 'expired')->assertJsonPath('data.can_confirm', false)->assertJsonPath('data.receipt_reference', $receipt);
        $this->postJson('/api/student-portal/reinscription/confirm', $this->contact())->assertOk()->assertJsonPath('receipt_reference', $receipt);
        $this->assertDatabaseCount('student_renewals', 1);
        Sanctum::actingAs($staff);
        $this->postJson('/api/admin/reinscriptions/send-reminders')->assertUnprocessable();
        Mail::assertNothingSent();
    }

    public function test_draft_future_closed_and_locked_windows_cannot_be_bypassed(): void
    {
        [$year, $student] = $this->context();
        $this->travelTo(Carbon::parse('2026-10-24 12:00:00', 'Africa/Casablanca'));
        $campaign = RenewalCampaign::create(['institution_id' => 1, 'academic_year_id' => $year->id, 'status' => 'draft', 'opens_on' => '2026-10-25', 'closes_on' => '2026-10-30']);
        Sanctum::actingAs($student->user);
        foreach (['draft', 'open', 'closed'] as $status) {
            $campaign->update(['status' => $status]);
            $this->postJson('/api/student-portal/reinscription/confirm', $this->contact())->assertUnprocessable();
        }
        $campaign->update(['status' => 'open', 'opens_on' => '2026-10-24']);
        $year->update(['is_locked' => true]);
        $this->getJson('/api/student-portal/reinscription/status')->assertOk()->assertJsonPath('data.campaign.state', 'year_locked')->assertJsonPath('data.can_confirm', false);
        $this->postJson('/api/student-portal/reinscription/confirm', $this->contact())->assertUnprocessable();
    }

    public function test_calendar_changes_are_authorized_validated_and_versioned(): void
    {
        [, $student, $staff] = $this->context();
        Sanctum::actingAs($student->user);
        $this->putJson('/api/admin/reinscriptions/campaign', $this->settings())->assertForbidden();
        $prof = User::factory()->create(['institution_id' => 1]);
        $prof->assignRole(Role::findOrCreate('professor', 'sanctum'));
        Sanctum::actingAs($prof);
        $this->getJson('/api/admin/reinscriptions/campaign')->assertForbidden();
        Sanctum::actingAs($staff);
        $this->putJson('/api/admin/reinscriptions/campaign', array_replace($this->settings(), ['closes_on' => '2026-10-23']))->assertUnprocessable();
        $this->putJson('/api/admin/reinscriptions/campaign', $this->settings())->assertOk();
        $this->putJson('/api/admin/reinscriptions/campaign', $this->settings())->assertConflict();
        $this->putJson('/api/admin/reinscriptions/campaign', array_replace($this->settings(), ['version' => 1, 'status' => 'closed']))->assertOk()->assertJsonPath('data.version', 2)->assertJsonPath('data.state', 'closed');
    }
}
