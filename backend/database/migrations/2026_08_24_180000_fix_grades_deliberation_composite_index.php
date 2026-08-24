<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Repair: the 2026_08_24_000001 migration no-op'd on the rewritten grades table
 * (student_id + assessment_id instead of exam_session_id + grade_component_id).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('grades') || Schema::hasIndex('grades', 'idx_grades_deliberation_fast')) {
            return;
        }

        if (! Schema::hasColumns('grades', ['student_id', 'assessment_id'])) {
            return;
        }

        Schema::table('grades', function (Blueprint $table) {
            $table->index(['student_id', 'assessment_id'], 'idx_grades_deliberation_fast');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('grades') || ! Schema::hasIndex('grades', 'idx_grades_deliberation_fast')) {
            return;
        }

        Schema::table('grades', function (Blueprint $table) {
            $table->dropIndex('idx_grades_deliberation_fast');
        });
    }
};
