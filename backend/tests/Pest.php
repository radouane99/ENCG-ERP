<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;
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
        // Reset Spatie permission cache so tests don't leak stale permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        DB::table('institutions')->insertOrIgnore([
            'id' => 1,
            'name' => 'ENCG Test',
            'code' => 'ENCG',
            'slug' => 'encg-test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    })
    ->in('Feature');
