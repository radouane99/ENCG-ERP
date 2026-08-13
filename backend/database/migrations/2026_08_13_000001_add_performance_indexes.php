<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_registrations', function (Blueprint $table) {
            $table->index(['academic_year_id', 'filiere_id', 'group_id'], 'idx_student_reg_group');
        });

        Schema::table('module_professor', function (Blueprint $table) {
            $table->index(['academic_year_id', 'professor_id', 'module_id'], 'idx_mod_prof_year');
        });

        Schema::table('grades', function (Blueprint $table) {
            $table->index(['assessment_id', 'student_id'], 'idx_grades_assessment_student');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_registrations', function (Blueprint $table) {
            $table->dropIndex('idx_student_reg_group');
        });

        Schema::table('module_professor', function (Blueprint $table) {
            $table->dropIndex('idx_mod_prof_year');
        });

        Schema::table('grades', function (Blueprint $table) {
            $table->dropIndex('idx_grades_assessment_student');
        });
    }
};
