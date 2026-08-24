<?php

use App\Console\Commands\AutoRefuseExpiredRetakes;
use App\Models\Institution;

it('resolves the retake justification deadline from a single institution settings key', function () {
    Institution::query()->whereKey(1)->update([
        'settings' => ['retake_justification_deadline' => '2026-09-15'],
    ]);

    $method = new ReflectionMethod(AutoRefuseExpiredRetakes::class, 'resolveJustificationDeadline');
    $deadline = $method->invoke(new AutoRefuseExpiredRetakes);

    expect($deadline)->toBe('2026-09-15');
});
