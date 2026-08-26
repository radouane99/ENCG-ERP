<?php

namespace Tests\Feature;

use App\Services\Academic\TimetableCampaignService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimetableCampaignServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_odd_semester_is_autumn_campaign(): void
    {
        $year = $this->makeTestAcademicYear();
        $autumn = $this->makeTestSemester($year->id, ['number' => 1, 'is_current' => true]);
        $service = app(TimetableCampaignService::class);

        $this->assertSame('AUTUMN', $service->inferCampaign($autumn));
        $this->assertSame('SPRING', $service->inferCampaign($this->makeTestSemester($year->id, ['number' => 2, 'is_current' => false])));
    }

    public function test_draft_is_blocked_when_campaign_is_closed(): void
    {
        $this->makeTestAcademicYear(['is_current' => true]);
        $filiere = $this->makeTestFiliere(['code' => 'TC']);
        $result = app(TimetableCampaignService::class)->generateDraft((int) $filiere->id);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('campagne', strtolower($result['message']));
    }
}
