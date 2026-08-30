<?php

declare(strict_types=1);

use App\Support\Utf8Text;

it('repairs CP437 mojibake for Fès and École', function () {
    expect(Utf8Text::repair('Admin ENCG F├¿s'))->toBe('Admin ENCG Fès')
        ->and(Utf8Text::repair('├ëcole Nationale'))->toStartWith('École')
        ->and(Utf8Text::repair('Isma├»l'))->toBe('Ismaïl')
        ->and(Utf8Text::repair('Marketing Strat├⌐gique'))->toBe('Marketing Stratégique')
        ->and(Utf8Text::repair('├ëtudes de March├⌐'))->toBe('Études de Marché')
        ->and(Utf8Text::repair('Fès'))->toBe('Fès')
        ->and(Utf8Text::repair(null))->toBeNull();
});

it('formats academic year labels to short YY-YY', function () {
    expect(App\Models\AcademicYear::toShortLabel('2024-2025'))->toBe('24-25')
        ->and(App\Models\AcademicYear::toShortLabel('2023/2024'))->toBe('23-24')
        ->and(App\Models\AcademicYear::toShortLabel('2026-27'))->toBe('26-27')
        ->and(App\Models\AcademicYear::toShortLabel(null))->toBe('—');
});

it('builds displayLabel from label column not name', function () {
    $year = new App\Models\AcademicYear([
        'label' => '2025-2026',
        'start_year' => 2025,
        'end_year' => 2026,
    ]);

    expect($year->displayLabel())->toBe('2025-2026')
        ->and(App\Models\AcademicYear::toShortLabel($year->displayLabel()))->toBe('25-26');
});
