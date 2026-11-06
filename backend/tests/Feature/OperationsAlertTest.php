<?php

namespace Tests\Feature;

use App\Mail\OperationsAlertMail;
use App\Services\Monitoring\OperationsAlertService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OperationsAlertTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['observability.alert_email' => 'operations@example.test', 'observability.alert_cache_store' => 'array', 'observability.prometheus_url' => 'http://monitoring.test']);
        Mail::fake();
        Http::preventStrayRequests();
    }

    private function response(array $alerts): array
    {
        return ['status' => 'success', 'data' => ['alerts' => $alerts]];
    }

    private function incident(): array
    {
        return ['state' => 'firing', 'labels' => ['alertname' => 'ErpBackupOverdue', 'severity' => 'critical'], 'annotations' => ['summary' => 'Synthetic alert']];
    }

    public function test_only_new_and_resolved_incidents_generate_messages(): void
    {
        Http::fake(['monitoring.test/*' => Http::sequence()->push($this->response([$this->incident()]))->push($this->response([$this->incident()]))->push($this->response([]))->push($this->response([]))]);
        $service = app(OperationsAlertService::class);
        $this->assertTrue($service->sendChanges()['sent']);
        $this->assertFalse($service->sendChanges()['sent']);
        $this->assertSame(1, $service->sendChanges()['resolved']);
        $this->assertFalse($service->sendChanges()['sent']);
        Mail::assertSent(OperationsAlertMail::class, 2);
        Mail::assertSent(OperationsAlertMail::class, fn ($mail) => $mail->hasTo('operations@example.test') && count($mail->resolvedAlerts) === 1);
    }

    public function test_transport_failure_does_not_acknowledge_an_unsent_incident(): void
    {
        Http::fake(['monitoring.test/*' => Http::response($this->response([$this->incident()]))]);
        Mail::shouldReceive('to')->once()->andThrow(new \RuntimeException('Synthetic mail failure'));
        try {
            app(OperationsAlertService::class)->sendChanges();
            $this->fail('Expected failed transport');
        } catch (\RuntimeException) {
            $this->assertNull(Cache::store('array')->get('operations_alert_last_delivered'));
        }
    }

    public function test_monitoring_failure_does_not_falsely_resolve_previous_incidents(): void
    {
        Http::fake(['monitoring.test/*' => Http::sequence()->push($this->response([$this->incident()]))->pushStatus(503)->pushStatus(503)]);
        $service = app(OperationsAlertService::class);
        $service->sendChanges();
        $result = $service->sendChanges();
        $this->assertSame(0, $result['resolved']);
        $this->assertSame(1, $result['new']);
        $this->assertFalse($service->sendChanges()['sent']);
        Mail::assertSent(OperationsAlertMail::class, 2);
    }

    public function test_unconfigured_recipient_and_pending_alerts_send_nothing(): void
    {
        config(['observability.alert_email' => null]);
        $this->assertFalse(app(OperationsAlertService::class)->sendChanges()['enabled']);
        Http::assertNothingSent();
        config(['observability.alert_email' => 'operations@example.test']);
        $pending = $this->incident();
        $pending['state'] = 'pending';
        Http::fake(['monitoring.test/*' => Http::response($this->response([$pending]))]);
        $this->assertFalse(app(OperationsAlertService::class)->sendChanges()['sent']);
        Mail::assertNothingSent();
    }

    public function test_delivery_probe_targets_only_the_configured_recipient_and_does_not_acknowledge_alerts(): void
    {
        $this->assertTrue(app(OperationsAlertService::class)->sendTest()['transport_accepted']);
        Mail::assertSent(OperationsAlertMail::class, fn ($mail) => $mail->testDelivery && $mail->hasTo('operations@example.test'));
        Http::assertNothingSent();
        $this->assertNull(Cache::store('array')->get('operations_alert_last_delivered'));
    }
}
