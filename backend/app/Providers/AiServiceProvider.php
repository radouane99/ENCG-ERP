<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Domain\AI\Contracts\AiDriverInterface;
use App\Domain\AI\Services\StubAiDriver;
use App\Domain\AI\Services\GeminiAiDriver;

class AiServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AiDriverInterface::class, function ($app) {
            $driver = env('AI_DRIVER', 'stub');

            if ($driver === 'gemini') {
                return new GeminiAiDriver();
            }

            // Default to stub for local dev without API key
            return new StubAiDriver();
        });
    }

    public function boot(): void
    {
        //
    }
}
