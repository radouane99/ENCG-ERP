<?php

namespace Tests\Feature;

use App\Models\AdmissionCampaign;
use App\Models\Institution;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PublicAdmissionCalendarTest extends TestCase
{
    use RefreshDatabase;

    private function campaign(array $data = []): AdmissionCampaign
    {
        return AdmissionCampaign::create(array_merge(['institution_id' => 1, 'academic_year_id' => $this->makeTestAcademicYear()->id,
            'filiere_id' => $this->makeTestFiliere()->id, 'name' => 'Synthetic TAFEM', 'status' => 'open', 'entry_route' => 'tafem', 'entry_semester' => 1,
            'open_date' => '2026-11-01', 'close_date' => '2026-11-10', 'target_capacity' => 50], $data));
    }

    public function test_empty_or_draft_calendar_does_not_announce_an_open_session(): void
    {
        $this->getJson('/api/public/admissions/calendar')->assertOk()->assertJsonPath('data.state', 'closed')->assertJsonCount(0, 'data.campaigns');
        $this->campaign(['status' => 'draft', 'name' => 'PRIVATE DRAFT']);
        $this->getJson('/api/public/admissions/calendar')->assertOk()->assertJsonPath('data.state', 'closed')->assertJsonMissing(['name' => 'PRIVATE DRAFT']);
    }

    public function test_scheduled_session_opens_at_moroccan_midnight_and_closes_after_last_day(): void
    {
        $campaign = $this->campaign();
        $this->travelTo(CarbonImmutable::parse('2026-10-31 23:59:59', 'Africa/Casablanca'));
        $this->getJson('/api/public/admissions/calendar')->assertOk()->assertJsonPath('data.state', 'upcoming')->assertJsonPath('data.campaigns.0.state', 'upcoming');
        $this->travelTo(CarbonImmutable::parse('2026-11-01 00:00:00', 'Africa/Casablanca'));
        $this->getJson('/api/public/admissions/calendar')->assertOk()->assertJsonPath('data.state', 'open');
        $this->travelTo(CarbonImmutable::parse('2026-11-10 23:59:59', 'Africa/Casablanca'));
        $this->assertSame('open', $campaign->registrationState());
        $this->travelTo(CarbonImmutable::parse('2026-11-11 00:00:00', 'Africa/Casablanca'));
        $this->getJson('/api/public/admissions/calendar')->assertOk()->assertJsonPath('data.state', 'closed')->assertJsonCount(0, 'data.campaigns');
    }

    public function test_manual_close_overrides_dates_and_endpoint_is_not_cached(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-05 12:00:00', 'Africa/Casablanca'));
        $campaign = $this->campaign();
        $this->getJson('/api/public/admissions/calendar')->assertJsonPath('data.state', 'open')->assertHeader('Cache-Control', 'no-store, private');
        $campaign->update(['status' => 'closed']);
        $this->getJson('/api/public/admissions/calendar')->assertJsonPath('data.state', 'closed');
    }

    public function test_other_institutions_are_not_exposed(): void
    {
        $institution = Institution::create(['name' => 'Other', 'code' => 'OTHER', 'slug' => 'other', 'city' => 'Fes', 'type' => 'grande_ecole']);
        $this->campaign(['institution_id' => $institution->id, 'name' => 'OTHER PRIVATE']);
        $this->getJson('/api/public/admissions/calendar')->assertOk()->assertJsonCount(0, 'data.campaigns');
    }

    public function test_api_cannot_register_before_opening_even_with_explicit_campaign_id(): void
    {
        Mail::fake();
        Notification::fake();
        $this->travelTo(CarbonImmutable::parse('2026-10-31 12:00:00', 'Africa/Casablanca'));
        $campaign = $this->campaign();
        $this->postJson('/api/v1/auth/register', ['first_name' => 'Synthetic', 'last_name' => 'Candidate', 'email' => 'synthetic@example.test', 'cne' => 'N123456789', 'cin' => 'AB12345', 'password' => 'Synthetic123!', 'password_confirmation' => 'Synthetic123!', 'campaign_id' => $campaign->id])->assertStatus(422);
        $this->assertDatabaseMissing('users', ['email' => 'synthetic@example.test']);
    }

    public function test_newer_scheduled_campaign_does_not_hide_current_open_session(): void
    {
        Mail::fake();
        Notification::fake();
        $this->travelTo(CarbonImmutable::parse('2026-11-05 12:00:00', 'Africa/Casablanca'));
        $active = $this->campaign(['entry_route' => 'cnaem', 'entry_semester' => 5]);
        $this->campaign(['open_date' => '2026-12-01', 'close_date' => '2026-12-15']);
        $this->postJson('/api/v1/auth/register', ['first_name' => 'Synthetic', 'last_name' => 'Candidate', 'email' => 'synthetic@example.test', 'cne' => 'N123456789', 'cin' => 'AB12345', 'password' => 'Synthetic123!', 'password_confirmation' => 'Synthetic123!', 'campaign_id' => $active->id])->assertOk();
        $this->assertDatabaseHas('applications', ['email' => 'synthetic@example.test', 'admission_campaign_id' => $active->id]);
    }
}
