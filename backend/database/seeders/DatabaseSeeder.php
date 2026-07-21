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
        // PostgreSQL compatible: use session_replication_role instead of MySQL's FOREIGN_KEY_CHECKS
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        } elseif ($driver === 'pgsql') {
            DB::statement('SET session_replication_role = replica;');
        }

        DB::transaction(function () {
            $this->call([
                RbacSeeder::class,
                EncgFesSeeder::class,
                MobilityPartnerSeeder::class,
            ]);

            $rbacSeeder = new RbacSeeder();
            $rbacSeeder->run();
        });

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } elseif ($driver === 'pgsql') {
            DB::statement('SET session_replication_role = DEFAULT;');
        }
    }
}
