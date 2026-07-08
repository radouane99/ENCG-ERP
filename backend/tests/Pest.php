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
        \Illuminate\Support\Facades\DB::table('institutions')->insertOrIgnore([
            'id' => 1,
            'name' => 'ENCG Test',
            'code' => 'ENCG',
            'slug' => 'encg-test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    })
    ->in('Feature');
