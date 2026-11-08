<?php

namespace App\Console\Commands;

use App\Jobs\DeploymentQueueProbe;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CheckDeploymentQueue extends Command
{
    protected $signature = 'operations:check-deployment-queue {--timeout=60}';

    protected $description = 'Verify that a deployed worker processes a synthetic job.';

    public function handle(): int
    {
        $timeout = filter_var($this->option('timeout'), FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1, 'max_range' => 120],
        ]);
        if ($timeout === false || config('queue.default') !== 'redis' || config('cache.default') !== 'redis') {
            $this->error('A Redis queue, shared Redis cache and timeout between 1 and 120 seconds are required.');

            return self::FAILURE;
        }

        $key = 'deployment-probe:'.Str::uuid();
        try {
            DeploymentQueueProbe::dispatch($key);
            $deadline = microtime(true) + $timeout;
            do {
                if (Cache::get($key) === true) {
                    $this->info('Deployment queue probe processed successfully.');

                    return self::SUCCESS;
                }
                usleep(250000);
            } while (microtime(true) < $deadline);

            $this->error('No worker acknowledgement before the deployment probe expired.');

            return self::FAILURE;
        } finally {
            Cache::forget($key);
        }
    }
}
