<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resit_eligibilities', function (Blueprint $table) {
            // Drop the old unique constraint and FK so we can change the column
            $table->dropForeign(['exam_session_id']);
            $table->dropUnique('resit_eligibility_unique');

            // Make the column nullable (ExamSession may not exist)
            $table->foreignId('exam_session_id')->nullable()->change();

            // Re-add a FK that allows NULL
            $table->foreign('exam_session_id')
                  ->references('id')->on('exam_sessions')
                  ->nullOnDelete();

            // New unique constraint that handles NULL (student+module only)
            $table->unique(['student_id', 'module_id'], 'resit_eligibility_student_module_unique');
        });
    }

    public function down(): void
    {
        Schema::table('resit_eligibilities', function (Blueprint $table) {
            $table->dropUnique('resit_eligibility_student_module_unique');
            $table->dropForeign(['exam_session_id']);
            $table->foreignId('exam_session_id')->nullable(false)->change();
            $table->foreign('exam_session_id')->references('id')->on('exam_sessions')->cascadeOnDelete();
            $table->unique(['student_id', 'module_id', 'exam_session_id'], 'resit_eligibility_unique');
        });
    }
};
