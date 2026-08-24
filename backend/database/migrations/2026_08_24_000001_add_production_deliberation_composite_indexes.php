<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Strategic composite indexes for ENCG Fès deliberations, group filtering, and room conflicts.
     */
    public function up(): void
    {
        if (Schema::hasTable('grades') && ! Schema::hasIndex('grades', 'idx_grades_deliberation_fast')) {
            Schema::table('grades', function (Blueprint $table) {
                // Current Apogée schema (student_id + assessment_id). Legacy columns are not present.
                if (Schema::hasColumns('grades', ['student_id', 'assessment_id'])) {
                    $table->index(['student_id', 'assessment_id'], 'idx_grades_deliberation_fast');
                } elseif (Schema::hasColumns('grades', ['student_id', 'exam_session_id', 'grade_component_id'])) {
                    $table->index(['student_id', 'exam_session_id', 'grade_component_id'], 'idx_grades_deliberation_fast');
                }
            });
        }

        if (Schema::hasTable('student_pathways') && ! Schema::hasIndex('student_pathways', 'idx_pathways_group_year_fast')) {
            Schema::table('student_pathways', function (Blueprint $table) {
                if (Schema::hasColumns('student_pathways', ['academic_year_id', 'group_id', 'student_id'])) {
                    $table->index(['academic_year_id', 'group_id', 'student_id'], 'idx_pathways_group_year_fast');
                }
            });
        }

        if (Schema::hasTable('schedules') && ! Schema::hasIndex('schedules', 'idx_schedules_conflict_fast')) {
            Schema::table('schedules', function (Blueprint $table) {
                if (Schema::hasColumns('schedules', ['room_id', 'day_of_week', 'start_time', 'end_time'])) {
                    $table->index(['room_id', 'day_of_week', 'start_time', 'end_time'], 'idx_schedules_conflict_fast');
                }
            });
        }
    }

    public function down(): void
    {
        $this->dropIndexIfExists('grades', 'idx_grades_deliberation_fast');
        $this->dropIndexIfExists('student_pathways', 'idx_pathways_group_year_fast');
        $this->dropIndexIfExists('schedules', 'idx_schedules_conflict_fast');
    }

    private function dropIndexIfExists(string $table, string $index): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasIndex($table, $index)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($index) {
            $blueprint->dropIndex($index);
        });
    }
};
