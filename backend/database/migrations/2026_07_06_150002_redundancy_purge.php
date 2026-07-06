<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('two_factor_auth');
        Schema::dropIfExists('alumni');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('user_devices');
        Schema::dropIfExists('complaints');
        Schema::dropIfExists('contact_submissions');
        Schema::dropIfExists('student_documents');
        Schema::dropIfExists('application_documents');
        // EXAMINATIONS KEPT ALIVE
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('quizzes');
        Schema::dropIfExists('assignment_submissions');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('schedule_change_requests');
        Schema::dropIfExists('compensation_results');
        Schema::dropIfExists('resit_eligibilities');
        Schema::dropIfExists('ai_conversations');
        Schema::dropIfExists('ai_generated_content');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Re-creating these is out of scope for a rollback
    }
};
