<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class DeploymentQueueProbe implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public string $cacheKey) {}

    public function handle(): void
    {
        Cache::put($this->cacheKey, true, now()->addMinutes(5));
    }
}
