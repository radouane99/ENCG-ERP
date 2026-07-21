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
            $driver = env('AI_DRIVER');

            if (empty($driver)) {
                throw new \InvalidArgumentException('AI_DRIVER is not configured. Set AI_DRIVER=gemini in your .env file.');
            }

            if ($driver === 'gemini') {
                return new GeminiAiDriver();
            }

            if ($driver === 'stub') {
                if ($app->environment('production')) {
                    throw new \InvalidArgumentException('AI_DRIVER=stub is not allowed in production. Set AI_DRIVER=gemini and configure GEMINI_API_KEY.');
                }

                return new StubAiDriver();
            }

            throw new \InvalidArgumentException("Unsupported AI_DRIVER '{$driver}'. Supported values are: gemini, stub.");
        });
    }

    public function boot(): void
    {
        //
    }
}
