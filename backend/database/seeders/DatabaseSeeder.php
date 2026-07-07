<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

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
                EncgFesSeeder::class,        // Infrastructure, Academic Core
                UserSeeder::class,           // Admins, Professors, Students
                EnrollmentSeeder::class,     // Groups, Registrations
                ScheduleSeeder::class,       // Timetables
                TransactionalSeeder::class,  // Document requests, Absences, Grades, Projects
            ]);
        });

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
}
