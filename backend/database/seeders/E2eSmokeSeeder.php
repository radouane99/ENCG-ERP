<?php

namespace Database\Seeders;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class E2eSmokeSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('testing') || ! str_ends_with((string) DB::connection()->getDatabaseName(), '_test')) {
            throw new \RuntimeException('E2E fixtures are restricted to dedicated test databases.');
        }
        Institution::firstOrCreate(['id' => 1], ['name' => 'ENCG Test', 'code' => 'ENCG-TEST', 'slug' => 'encg-test']);
        $user = User::firstOrProvision(['email' => 'e2e.student@example.test'], [
            'name' => 'E2E Student', 'first_name' => 'E2E', 'last_name' => 'Student',
            'institution_id' => 1, 'password' => 'TestOnlyPassword123!', 'is_active' => true,
        ]);
        $user->assignRole(Role::findOrCreate('student', 'sanctum'));
    }
}
