<?php

namespace App\Services\Monitoring;

use App\Mail\OperationsAlertMail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

final class OperationsAlertService
{
    public function sendTest(): array
    {
        $email = config('observability.alert_email');
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \RuntimeException('No configured operations recipient');
        }
        $this->assertOutboundTransport();
        Mail::to($email)->send(new OperationsAlertMail([
            ['name' => 'Test de livraison', 'severity' => 'info', 'summary' => 'Test technique demandé : le relais des alertes ERP utilise cette adresse. Ce message de test ne signale aucun incident réel.'],
        ], [], true));

        return ['test' => true, 'transport_accepted' => true];
    }

    private function assertOutboundTransport(): void
    {
        if (! app()->environment('testing') && in_array(config('mail.default'), ['log', 'array'], true)) {
            throw new \RuntimeException('Outbound mail transport is not configured');
        }
    }

    public function sendChanges(): array
    {
        $email = config('observability.alert_email');
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['enabled' => false, 'sent' => false];
        }
        $cache = Cache::store(config('observability.alert_cache_store'));
        $lock = $cache->lock('operations_alert_delivery_lock', 120);
        if (! $lock->get()) {
            return ['enabled' => true, 'sent' => false];
        }
        try {
            $current = [];
            try {
                $response = Http::connectTimeout(3)->timeout(10)->get(rtrim(config('observability.prometheus_url'), '/').'/api/v1/alerts')->throw();
                if ($response->json('status') !== 'success' || ! is_array($response->json('data.alerts'))) {
                    throw new \RuntimeException('Monitoring response unavailable');
                }
                foreach ($response->json('data.alerts') as $alert) {
                    if (($alert['state'] ?? '') !== 'firing') {
                        continue;
                    }
                    $labels = $alert['labels'] ?? [];
                    ksort($labels);
                    $key = hash('sha256', json_encode($labels));
                    $current[$key] = [
                        'name' => mb_substr($labels['alertname'] ?? 'ERP', 0, 100),
                        'severity' => mb_substr($labels['severity'] ?? 'warning', 0, 30),
                        'summary' => mb_substr($alert['annotations']['summary'] ?? 'Vérifier le tableau de surveillance.', 0, 300),
                    ];
                }
            } catch (\Throwable) {
                // Do not falsely announce recovery of existing incidents when Prometheus is unavailable.
                $current = $cache->get('operations_alert_last_delivered', []);
                $current['monitoring-unavailable'] = ['name' => 'MonitoringUnavailable', 'severity' => 'critical', 'summary' => 'Prometheus est inaccessible ou sa réponse est invalide.'];
            }
            $previous = $cache->get('operations_alert_last_delivered', []);
            $new = array_diff_key($current, $previous);
            $resolved = array_diff_key($previous, $current);
            if (! $new && ! $resolved) {
                return ['enabled' => true, 'sent' => false];
            }
            $this->assertOutboundTransport();
            Mail::to($email)->send(new OperationsAlertMail(array_values($new), array_values($resolved)));
            // Persist only after successful transport, so a failure remains retryable.
            $cache->forever('operations_alert_last_delivered', $current);

            return ['enabled' => true, 'sent' => true, 'new' => count($new), 'resolved' => count($resolved)];
        } finally {
            $lock->release();
        }
    }
}
