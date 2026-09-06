<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('attendances')) {
            try {
                DB::statement('CREATE INDEX IF NOT EXISTS attendances_session_student_idx ON attendances (attendance_session_id, student_id);');
                DB::statement('CREATE INDEX IF NOT EXISTS attendances_student_status_idx ON attendances (student_id, status);');
            } catch (\Throwable $e) {
                // Graceful fallback for non-PostgreSQL drivers
            }
        }

        if (Schema::hasTable('attendance_sessions')) {
            try {
                DB::statement('CREATE INDEX IF NOT EXISTS attendance_sessions_mod_grp_date_idx ON attendance_sessions (module_id, group_id, session_date);');
                DB::statement('CREATE INDEX IF NOT EXISTS attendance_sessions_prof_date_idx ON attendance_sessions (professor_id, session_date);');
            } catch (\Throwable $e) {
                // Graceful fallback
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('attendances')) {
            try {
                DB::statement('DROP INDEX IF EXISTS attendances_session_student_idx;');
                DB::statement('DROP INDEX IF EXISTS attendances_student_status_idx;');
            } catch (\Throwable $e) {
            }
        }

        if (Schema::hasTable('attendance_sessions')) {
            try {
                DB::statement('DROP INDEX IF EXISTS attendance_sessions_mod_grp_date_idx;');
                DB::statement('DROP INDEX IF EXISTS attendance_sessions_prof_date_idx;');
            } catch (\Throwable $e) {
            }
        }
    }
};
