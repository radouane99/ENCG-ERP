<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        DB::transaction(function () {
            $this->call([
                RbacSeeder::class,           // Roles and Permissions
                EncgFesSeeder::class,        // Infrastructure, Academic Core, Users, Grades, Cards
            ]);

            // Re-run RbacSeeder to recreate default users (admin@encg-fes.ma, etc.) after EncgFesSeeder's cleanup wiped them.
            // This also ensures they are correctly linked to the newly created Institution.
            $rbacSeeder = new RbacSeeder();
            $rbacSeeder->run();
        });

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
}
