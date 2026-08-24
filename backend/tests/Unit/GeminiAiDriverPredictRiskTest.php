<?php

use App\Domain\AI\Services\GeminiAiDriver;
use Tests\TestCase;

uses(TestCase::class);

it('returns unknown risk with zero confidence when the AI response is not JSON', function () {
    config(['services.gemini.key' => '']);

    $prediction = (new GeminiAiDriver)->predictRisk([
        'absence_rate' => 45,
        'average' => 7.2,
    ]);

    expect($prediction['risk_level'])->toBe('Unknown')
        ->and($prediction['confidence'])->toBe(0.0)
        ->and($prediction['recommendation'])->toBe('Unable to generate risk prediction at this time.');
});
