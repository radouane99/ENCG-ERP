<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class SentryReporter
{
    public function capture(Throwable $exception): void
    {
        $dsn = (string) (config('sentry.dsn') ?: config('services.sentry.dsn', ''));
        if ($dsn === '' || app()->environment('testing')) {
            return;
        }

        if (function_exists('\\Sentry\\captureException')) {
            \Sentry\captureException($exception);

            return;
        }

        $parsed = $this->parseDsn($dsn);
        if ($parsed === null) {
            return;
        }

        try {
            $payload = [
                'event_id' => str_replace('-', '', (string) str()->uuid()),
                'timestamp' => now()->utc()->toIso8601String(),
                'platform' => 'php',
                'level' => 'error',
                'environment' => config('services.sentry.environment'),
                'server_name' => gethostname() ?: 'encg-erp',
                'exception' => [
                    'values' => [[
                        'type' => $exception::class,
                        'value' => $exception->getMessage(),
                        'stacktrace' => [
                            'frames' => $this->frames($exception),
                        ],
                    ]],
                ],
            ];

            Http::timeout(2)
                ->withHeaders([
                    'X-Sentry-Auth' => sprintf(
                        'Sentry sentry_version=7, sentry_client=encg-erp/1.0, sentry_key=%s',
                        $parsed['key']
                    ),
                    'Content-Type' => 'application/json',
                ])
                ->post($parsed['store_url'], $payload);
        } catch (Throwable $e) {
            Log::debug('Sentry report skipped: '.$e->getMessage());
        }
    }

    /**
     * @return array{key: string, store_url: string}|null
     */
    private function parseDsn(string $dsn): ?array
    {
        $parts = parse_url($dsn);
        if (! is_array($parts) || empty($parts['user']) || empty($parts['host']) || empty($parts['path'])) {
            return null;
        }

        $projectId = ltrim((string) $parts['path'], '/');
        $scheme = $parts['scheme'] ?? 'https';
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return [
            'key' => (string) $parts['user'],
            'store_url' => "{$scheme}://{$parts['host']}{$port}/api/{$projectId}/store/",
        ];
    }

    /**
     * @return list<array{filename: string, lineno: int, function: string, in_app: bool}>
     */
    private function frames(Throwable $exception): array
    {
        $frames = [];
        foreach (array_slice($exception->getTrace(), 0, 20) as $frame) {
            $frames[] = [
                'filename' => (string) ($frame['file'] ?? '[internal]'),
                'lineno' => (int) ($frame['line'] ?? 0),
                'function' => (string) ($frame['function'] ?? ''),
                'in_app' => str_contains((string) ($frame['file'] ?? ''), base_path('app')),
            ];
        }

        return $frames;
    }
}
