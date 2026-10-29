<?php

namespace App\Services\Monitoring;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Laravel\Horizon\Contracts\MasterSupervisorRepository;

final class RuntimeMetrics
{
    private const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'OTHER'];

    private const BUCKETS = [0.05, 0.1, 0.3, 1, 3, 10];

    public function record(string $method, int $status, float $seconds): void
    {
        $method = in_array($method, self::METHODS, true) ? $method : 'OTHER';
        $class = min(5, max(1, intdiv($status, 100))).'xx';
        $values = ['count' => 1, 'microseconds' => (int) round(max(0, $seconds) * 1000000)];
        foreach (self::BUCKETS as $index => $bound) {
            if ($seconds <= $bound) {
                $values['bucket_'.$index] = 1;
            }
        }
        $cache = Cache::store(config('observability.cache_store'));
        foreach ($values as $name => $increment) {
            $key = 'encg_metrics:v1:'.$method.':'.$class.':'.$name;
            $cache->add($key, 0, 30 * 86400);
            $cache->increment($key, $increment);
        }
    }

    public function render(): string
    {
        $lines = ['# HELP encg_http_requests_total Application HTTP requests; labels never include URLs or user data.', '# TYPE encg_http_requests_total counter',
            '# HELP encg_http_request_duration_seconds Application processing time excluding response streaming.', '# TYPE encg_http_request_duration_seconds histogram'];
        $keys = [];
        foreach (self::METHODS as $method) {
            foreach (range(1, 5) as $code) {
                foreach (array_merge(['count', 'microseconds'], array_map(fn ($i) => 'bucket_'.$i, array_keys(self::BUCKETS))) as $name) {
                    $keys[] = 'encg_metrics:v1:'.$method.':'.$code.'xx:'.$name;
                }
            }
        }
        try {
            $stored = Cache::store(config('observability.cache_store'))->many($keys);
            $httpUp = 1;
        } catch (\Throwable) {
            $stored = [];
            $httpUp = 0;
        }
        foreach (self::METHODS as $method) {
            foreach (range(1, 5) as $code) {
                $label = 'method="'.$method.'",status_class="'.$code.'xx"';
                $key = 'encg_metrics:v1:'.$method.':'.$code.'xx:';
                $count = (int) ($stored[$key.'count'] ?? 0);
                $lines[] = 'encg_http_requests_total{'.$label.'} '.$count;
                $lines[] = 'encg_http_request_duration_seconds_count{'.$label.'} '.$count;
                $lines[] = 'encg_http_request_duration_seconds_sum{'.$label.'} '.sprintf('%.6F', ((int) ($stored[$key.'microseconds'] ?? 0)) / 1000000);
                foreach (self::BUCKETS as $index => $bound) {
                    $lines[] = 'encg_http_request_duration_seconds_bucket{'.$label.',le="'.$bound.'"} '.(int) ($stored[$key.'bucket_'.$index] ?? 0);
                }
                $lines[] = 'encg_http_request_duration_seconds_bucket{'.$label.',le="+Inf"} '.$count;
            }
        }
        $gauges = $this->collect();
        $gauges['encg_http_metrics_storage_up'] = $httpUp;
        $typed = [];
        foreach ($gauges as $name => $value) {
            $base = explode('{', $name)[0];
            if (! isset($typed[$base])) {
                $lines[] = '# TYPE '.$base.' gauge';
                $typed[$base] = true;
            }
            $lines[] = $name.' '.sprintf('%.6F', $value);
        }

        return implode("\n", $lines)."\n";
    }

    private function collect(): array
    {
        $values = ['encg_database_up' => 0, 'encg_redis_up' => 0, 'encg_horizon_up' => 0, 'encg_queue_depth' => 0];
        try {
            DB::select('SELECT 1');
            $values['encg_database_up'] = 1;
        } catch (\Throwable) {
        }
        try {
            Redis::connection()->ping();
            $values['encg_redis_up'] = 1;
        } catch (\Throwable) {
        }
        try {
            $values['encg_horizon_up'] = collect(app(MasterSupervisorRepository::class)->all())->contains(fn ($master) => ($master->status ?? '') === 'running') ? 1 : 0;
        } catch (\Throwable) {
        }
        try {
            $values['encg_queue_depth'] = Queue::connection()->size('default');
            $values['encg_metrics_collection_success{collector="queue"}'] = 1;
        } catch (\Throwable) {
            $values['encg_metrics_collection_success{collector="queue"}'] = 0;
        }
        try {
            $values['encg_failed_jobs_24h'] = DB::table('failed_jobs')->where('failed_at', '>=', now()->subDay())->count();
            $values['encg_metrics_collection_success{collector="jobs"}'] = 1;
        } catch (\Throwable) {
            $values['encg_metrics_collection_success{collector="jobs"}'] = 0;
        }
        try {
            $counts = DB::table('admission_ocr_runs')->where('created_at', '>=', now()->subDay())->selectRaw('status, COUNT(*) AS total')->groupBy('status')->pluck('total', 'status');
            foreach (['queued', 'processing', 'needs_review', 'succeeded', 'failed', 'cancelled'] as $status) {
                $values['encg_ocr_runs_24h{status="'.$status.'"}'] = (int) ($counts[$status] ?? 0);
            }
            $oldest = DB::table('admission_ocr_runs')->whereIn('status', ['queued', 'processing'])->min('created_at');
            $values['encg_ocr_oldest_pending_seconds'] = $oldest ? max(0, now()->getTimestamp() - strtotime($oldest)) : 0;
            $values['encg_metrics_collection_success{collector="ocr"}'] = 1;
        } catch (\Throwable) {
            $values['encg_metrics_collection_success{collector="ocr"}'] = 0;
        }

        return $values;
    }
}
