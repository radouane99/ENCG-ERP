<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\Analytics\DashboardAnalyticsService;
use Tests\TestCase;

class ProfessorDashboardStatsTest extends TestCase
{
    public function test_amina_chraibi_stats_reflect_module_professor_assignments(): void
    {
        $userId = (int) User::where('email', 'gm02.ems03@gmail.com')->value('id');
        $this->assertGreaterThan(0, $userId);

        $result = app(DashboardAnalyticsService::class)->getProfessorStats($userId);

        $this->assertTrue($result['success'] ?? false);
        $this->assertArrayNotHasKey('error_debug', $result);
        $this->assertSame(12, $result['data']['total_modules']);
        $this->assertGreaterThan(0, $result['data']['total_students']);
        $this->assertSame(6, $result['data']['total_groups']);
        $this->assertSame(324, $result['data']['statutory_hours_done']);
        $this->assertCount(12, $result['data']['modules_list']);
    }
}
