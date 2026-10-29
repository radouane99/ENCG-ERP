<?php

namespace Tests\Feature;

use App\Services\Monitoring\RuntimeMetrics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Route;
use Laravel\Horizon\Contracts\MasterSupervisorRepository;
use Tests\TestCase;

class ObservabilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['observability.enabled' => true, 'observability.metrics_token' => str_repeat('a', 64), 'observability.cache_store' => 'array']);
        Redis::shouldReceive('connection->ping')->andReturn('PONG');
        $this->mock(MasterSupervisorRepository::class)->shouldReceive('all')->andReturn([(object) ['status' => 'running']]);
    }

    public function test_metrics_are_disabled_by_default_and_require_a_dedicated_bearer_token(): void
    {
        config(['observability.enabled' => false]);
        $this->getJson('/api/internal/metrics')->assertNotFound();
        config(['observability.enabled' => true]);
        $this->getJson('/api/internal/metrics')->assertUnauthorized();
        $this->getJson('/api/internal/metrics?token='.str_repeat('a', 64))->assertUnauthorized();
        $this->withHeader('Authorization', 'Bearer wrong')->getJson('/api/internal/metrics')->assertUnauthorized();
        $this->withHeader('Authorization', 'Bearer '.str_repeat('a', 64))->get('/api/internal/metrics')
            ->assertOk()->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_request_metrics_use_bounded_labels_and_never_export_urls_names_or_tokens(): void
    {
        Route::get('/api/observability-test/{name}', fn () => response()->json(['ok' => true], 201));
        $this->getJson('/api/observability-test/PRIVATE-STUDENT?token=PRIVATE-SECRET')->assertStatus(201);
        app(RuntimeMetrics::class)->record('POST', 503, 0.2);
        $response = $this->withHeader('Authorization', 'Bearer '.str_repeat('a', 64))->get('/api/internal/metrics')->assertOk();
        $text = $response->getContent();
        $this->assertStringContainsString('encg_http_requests_total{method="GET",status_class="2xx"} 1', $text);
        $this->assertStringContainsString('encg_http_request_duration_seconds_bucket{method="POST",status_class="5xx",le="0.3"} 1', $text);
        $this->assertStringContainsString('encg_database_up 1.000000', $text);
        $this->assertStringContainsString('encg_horizon_up 1.000000', $text);
        foreach (['PRIVATE-STUDENT', 'PRIVATE-SECRET', str_repeat('a', 64), '/api/observability-test'] as $private) {
            $this->assertStringNotContainsString($private, $text);
        }
        $this->assertLessThan(500, substr_count($text, "\n"));
    }

    public function test_monitoring_failure_cannot_break_application_requests(): void
    {
        Route::get('/api/observability-ok', fn () => response()->json(['ok' => true]));
        Cache::shouldReceive('store')->andThrow(new \RuntimeException('SYNTHETIC-CACHE-FAILURE'));
        $this->getJson('/api/observability-ok')->assertOk()->assertJsonPath('ok', true);
    }

    public function test_ocr_gauges_export_counts_only_and_distinguish_pending_age(): void
    {
        $this->makeTestAcademicYear();
        // Empty OCR data must still emit zeroes and successful collection, not private records.
        $text = $this->withHeader('Authorization', 'Bearer '.str_repeat('a', 64))->get('/api/internal/metrics')->assertOk()->getContent();
        $this->assertStringContainsString('encg_ocr_runs_24h{status="failed"} 0.000000', $text);
        $this->assertStringContainsString('encg_ocr_oldest_pending_seconds 0.000000', $text);
        $this->assertStringContainsString('encg_metrics_collection_success{collector="ocr"} 1.000000', $text);
        $this->assertSame(0, DB::table('admission_ocr_runs')->count());
    }
}
