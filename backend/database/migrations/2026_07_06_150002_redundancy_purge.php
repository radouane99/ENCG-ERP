<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'two_factor_auth', 'alumni', 'audit_logs', 'user_devices',
            'complaints', 'contact_submissions', 'student_documents',
            'application_documents', 'assignments', 'quizzes',
            'assignment_submissions', 'quiz_attempts', 'schedule_change_requests',
            'compensation_results', 'resit_eligibilities', 'ai_conversations',
            'ai_generated_content',
        ];

        if (DB::getDriverName() === 'pgsql') {
            foreach ($tables as $table) {
                DB::statement("DROP TABLE IF EXISTS \"{$table}\" CASCADE");
            }
        } else {
            foreach ($tables as $table) {
                Schema::dropIfExists($table);
            }
        }
    }

    public function down(): void
    {
        // Re-creating these is out of scope for a rollback
    }
};
