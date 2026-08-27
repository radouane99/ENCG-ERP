<?php

declare(strict_types=1);

use App\Support\Utf8Text;

it('repairs CP437 mojibake for Fès and École', function () {
    expect(Utf8Text::repair('Admin ENCG F├¿s'))->toBe('Admin ENCG Fès')
        ->and(Utf8Text::repair('├ëcole Nationale'))->toStartWith('École')
        ->and(Utf8Text::repair('Isma├»l'))->toBe('Ismaïl')
        ->and(Utf8Text::repair('Fès'))->toBe('Fès')
        ->and(Utf8Text::repair(null))->toBeNull();
});
