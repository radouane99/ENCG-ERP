<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL requires CASCADE to drop tables with dependent foreign keys.
        // Schema::disableForeignKeyConstraints() does NOT work reliably with pgsql.
        DB::statement('DROP TABLE IF EXISTS "two_factor_auth" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "alumni" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "audit_logs" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "user_devices" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "complaints" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "contact_submissions" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "student_documents" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "application_documents" CASCADE');
        // EXAMINATIONS KEPT ALIVE
        DB::statement('DROP TABLE IF EXISTS "assignments" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "quizzes" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "assignment_submissions" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "quiz_attempts" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "schedule_change_requests" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "compensation_results" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "resit_eligibilities" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "ai_conversations" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "ai_generated_content" CASCADE');
    }

    public function down(): void
    {
        // Re-creating these is out of scope for a rollback
    }
};
