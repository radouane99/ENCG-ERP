<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Pest Bootstrap
|--------------------------------------------------------------------------
| Apply RefreshDatabase to all Feature tests.
| Unit tests in tests/Unit/ use plain PHPUnit — do NOT add them here.
*/
uses(TestCase::class, RefreshDatabase::class)
    ->beforeEach(function () {
        \App\Models\Institution::firstOrCreate(
            ['id' => 1],
            ['name' => 'ENCG Test', 'code' => 'ENCG', 'slug' => 'encg-test']
        );
    })
    ->in('Feature');
