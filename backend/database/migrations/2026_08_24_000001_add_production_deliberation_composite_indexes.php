<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Strategic composite indexes for Moroccan Higher Education ERP (ENCG Fès)
     * To accelerate deliberations, student group filtering, and room conflict resolution.
     */
    public function up(): void
    {
        // 1. Deliberation Fast Query Index on grades
        if (Schema::hasTable('grades')) {
            Schema::table('grades', function (Blueprint $table) {
                // Check if columns exist
                if (Schema::hasColumns('grades', ['student_id', 'exam_session_id', 'grade_component_id'])) {
                    $table->index(['student_id', 'exam_session_id', 'grade_component_id'], 'idx_grades_deliberation_fast');
                }
            });
        }

        // 2. Student Pathway Group & Academic Year Fast Index
        if (Schema::hasTable('student_pathways')) {
            Schema::table('student_pathways', function (Blueprint $table) {
                if (Schema::hasColumns('student_pathways', ['academic_year_id', 'group_id', 'student_id'])) {
                    $table->index(['academic_year_id', 'group_id', 'student_id'], 'idx_pathways_group_year_fast');
                }
            });
        }

        // 3. Timetable Room Anti-Conflict Index
        if (Schema::hasTable('schedules')) {
            Schema::table('schedules', function (Blueprint $table) {
                if (Schema::hasColumns('schedules', ['room_id', 'day_of_week', 'start_time', 'end_time'])) {
                    $table->index(['room_id', 'day_of_week', 'start_time', 'end_time'], 'idx_schedules_conflict_fast');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('grades')) {
            Schema::table('grades', function (Blueprint $table) {
                $table->dropIndex('idx_grades_deliberation_fast');
            });
        }

        if (Schema::hasTable('student_pathways')) {
            Schema::table('student_pathways', function (Blueprint $table) {
                $table->dropIndex('idx_pathways_group_year_fast');
            });
        }

        if (Schema::hasTable('schedules')) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->dropIndex('idx_schedules_conflict_fast');
            });
        }
    }
};
