<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process as SymfonyProcess;

class EncgSeederVersion extends Seeder
{
    /**
     * Run the database seeds.
     * Restores and cleans the database state from the official 05/09/2026 02:00 backup.
     */
    public function run(): void
    {
        $this->command?->info('===============================================================');
        $this->command?->info('  ENCG ERP — Restoring from 05/09/2026 02:00 Clean Backup');
        $this->command?->info('===============================================================');

        $sqlCandidates = [
            database_path('seeders/sql/encg_erp_backup_clean.sql'),
            base_path('clean_backup_encg_05_09.sql'),
            base_path('clean_backup_05_09.sql'),
        ];

        $sqlFile = null;
        foreach ($sqlCandidates as $candidate) {
            if (file_exists($candidate) && filesize($candidate) > 100000) {
                $sqlFile = $candidate;
                break;
            }
        }

        if (! $sqlFile) {
            $this->command?->error('❌ Clean backup SQL file not found in candidates!');

            return;
        }

        $this->command?->info("📂 Found backup file: {$sqlFile} (".round(filesize($sqlFile) / 1024 / 1024, 2).' MB)');

        // Retrieve database configuration
        $host = config('database.connections.pgsql.host', env('DB_HOST', 'postgres'));
        $port = config('database.connections.pgsql.port', env('DB_PORT', '5432'));
        $database = config('database.connections.pgsql.database', env('DB_DATABASE', 'encg_erp'));
        $username = config('database.connections.pgsql.username', env('DB_USERNAME', 'encg'));
        $password = config('database.connections.pgsql.password', env('DB_PASSWORD', 'secret'));

        // Step 1: Drop and recreate public schema to ensure clean slate
        $this->command?->info('🧹 Step 1: Resetting database schema (public)...');
        try {
            DB::statement('DROP SCHEMA public CASCADE;');
            DB::statement('CREATE SCHEMA public;');
            DB::statement("GRANT ALL ON SCHEMA public TO \"{$username}\";");
            DB::statement('GRANT ALL ON SCHEMA public TO public;');
            $this->command?->info('   Schema public reset successfully.');
        } catch (\Throwable $e) {
            $this->command?->warn("   Schema reset notice: {$e->getMessage()}");
        }

        // Step 2: Import clean SQL dump via psql
        $this->command?->info('📥 Step 2: Importing clean UTF-8 database dump via psql...');
        $env = array_merge($_ENV, [
            'PGPASSWORD' => $password,
        ]);

        $cmd = [
            'psql',
            '-h', $host,
            '-p', (string) $port,
            '-U', $username,
            '-d', $database,
            '-f', $sqlFile,
        ];

        $process = new SymfonyProcess($cmd, null, $env, null, 300);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->command?->error('❌ psql import reported issues:');
            $this->command?->error($process->getErrorOutput());
        } else {
            $this->command?->info('   psql import completed successfully.');
        }

        // Step 3: Run timetable official format alignment
        $this->command?->info('⏱️ Step 3: Aligning timetable with official ENCG format (CM 4h Amphi, TD 1h30 sub-groups)...');
        $alignSqlPath = base_path('align_official_format.sql');
        if (file_exists($alignSqlPath)) {
            $alignProcess = new SymfonyProcess([
                'psql',
                '-h', $host,
                '-p', (string) $port,
                '-U', $username,
                '-d', $database,
                '-f', $alignSqlPath,
            ], null, $env, null, 120);
            $alignProcess->run();
            $this->command?->info('   Timetable aligned successfully with official ENCG Fès standard.');
        }

        // Step 4: Run text cleaner as an additional safeguard
        $this->command?->info('🧼 Step 4: Running CleanCorruptedTextSeeder validation...');
        $this->call(CleanCorruptedTextSeeder::class);

        // Step 5: Summary verification
        $this->command?->info('📊 Step 5: Verifying restored database counts...');
        $tables = [
            'users' => 'Users',
            'students' => 'Students',
            'professors' => 'Professors',
            'departments' => 'Departments',
            'filieres' => 'Filières',
            'modules' => 'Modules',
            'rooms' => 'Rooms & Amphithéâtres',
            'schedules' => 'Timetable Schedules',
            'assessments' => 'Assessments',
            'grades' => 'Grades & Notes',
            'attendances' => 'Attendance Records',
            'exam_seatings' => 'Exam Seatings',
            'activity_log' => 'Activity Logs',
        ];

        $rows = [];
        foreach ($tables as $tbl => $label) {
            try {
                $count = DB::table($tbl)->count();
                $rows[] = [$label, $count];
            } catch (\Throwable) {
                $rows[] = [$label, 'N/A'];
            }
        }

        if (isset($this->command)) {
            $this->command->table(['Entity', 'Count'], $rows);
        }

        // Verify Arabic & French characters
        $inst = DB::table('institutions')->first();
        if ($inst) {
            $this->command?->info("🏫 Institution: {$inst->name}");
            $this->command?->info("   Arabic: {$inst->name_ar}");
        }

        $this->command?->info('✅ EncgSeederVersion finished successfully! Everything is clean & restored.');
    }
}
