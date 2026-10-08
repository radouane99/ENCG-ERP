<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Unify all legacy institution_id records (orphan ID 3 and nulls) to primary institution ID 1.
     */
    public function up(): void
    {
        // 1. Ensure Institution #1 exists with official metadata
        $existing = DB::table('institutions')->where('id', 1)->first();

        $institutionData = [
            'name' => 'École Nationale de Commerce et de Gestion de Fès',
            'name_ar' => 'المدرسة الوطنية للتجارة والتسيير بفاس',
            'code' => 'ENCG-FES',
            'slug' => 'encg-fes',
            'type' => 'grande_ecole',
            'address' => 'Route d\'Imouzzer, B.P. 1255',
            'city' => 'Fès',
            'phone' => '+212 5 35 64 49 20',
            'email' => 'contact@encg-fes.ma',
            'website' => 'https://www.encg-fes.ac.ma',
            'rector_name' => 'Prof. Hassan OULIDI',
            'director_name' => 'Prof. Hassan OULIDI',
            'is_active' => true,
            'settings' => json_encode([
                'academic_system' => 'semester',
                'grading_system' => '20',
                'passing_grade' => 10,
                'compensation' => true,
                'rattrapage' => true,
            ]),
            'updated_at' => now(),
        ];

        if ($existing) {
            DB::table('institutions')->where('id', 1)->update($institutionData);
        } else {
            $institutionData['id'] = 1;
            $institutionData['created_at'] = now();
            DB::table('institutions')->insert($institutionData);
        }

        // 2. Discover all tables having 'institution_id'
        $driver = DB::getDriverName();
        $tables = [];

        if ($driver === 'pgsql') {
            $results = DB::select("
                SELECT table_name
                FROM information_schema.columns
                WHERE column_name = 'institution_id'
                  AND table_schema = 'public'
            ");
            $tables = array_map(fn($r) => $r->table_name, $results);
        } elseif ($driver === 'mysql') {
            $results = DB::select("
                SELECT table_name
                FROM information_schema.columns
                WHERE column_name = 'institution_id'
                  AND table_schema = DATABASE()
            ");
            $tables = array_map(fn($r) => $r->TABLE_NAME ?? $r->table_name, $results);
        } else {
            // Fallback known tables list
            $tables = [
                'campuses', 'departments', 'filieres', 'academic_years', 'rooms',
                'modules', 'professors', 'students', 'users', 'audit_logs',
                'clubs', 'books', 'vacation_contracts', 'vacation_payments',
                'exam_sessions', 'deliberations', 'internships', 'final_projects',
                'document_templates', 'announcements', 'admission_campaigns',
                'applications', 'disciplinary_cases', 'schedules', 'ai_conversations',
            ];
        }

        // 3. Update all legacy institution_id (such as 3) to 1
        foreach ($tables as $tableName) {
            if ($tableName === 'institutions') {
                continue;
            }

            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'institution_id')) {
                DB::table($tableName)
                    ->where('institution_id', 3)
                    ->update(['institution_id' => 1]);
            }
        }

        // 4. Fill NULL institution_id for users and key academic tables
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'institution_id')) {
            DB::table('users')->whereNull('institution_id')->update(['institution_id' => 1]);
        }
        if (Schema::hasTable('students') && Schema::hasColumn('students', 'institution_id')) {
            DB::table('students')->whereNull('institution_id')->update(['institution_id' => 1]);
        }
        if (Schema::hasTable('professors') && Schema::hasColumn('professors', 'institution_id')) {
            DB::table('professors')->whereNull('institution_id')->update(['institution_id' => 1]);
        }

        // 5. Ensure sequence is aligned if PostgreSQL
        if ($driver === 'pgsql') {
            DB::statement("SELECT setval('institutions_id_seq', (SELECT GREATEST(MAX(id), 1) FROM institutions));");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed as this is a data integrity correction
    }
};
