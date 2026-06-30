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
        // ── grade_entry_periods ──────────────────────────────────
        Schema::create('grade_entry_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_session_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_open')->default(false);
            $table->foreignId('opened_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['academic_year_id', 'semester_id', 'exam_session_id'], 'unique_grade_period');
        });

        // ── resit_eligibilities ──────────────────────────────────
        Schema::create('resit_eligibilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->string('reason'); // 'justified_absence', 'failed_ordinary'
            $table->boolean('is_eligible')->default(true);
            $table->timestamps();

            $table->unique(['student_id', 'module_id', 'academic_year_id']);
        });

        // ── student_module_reservations ──────────────────────────
        Schema::create('student_module_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending'); // 'pending', 'validated', 'failed'
            $table->timestamps();

            $table->unique(['student_id', 'module_id', 'academic_year_id'], 'unique_module_reservation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_module_reservations');
        Schema::dropIfExists('resit_eligibilities');
        Schema::dropIfExists('grade_entry_periods');
    }
};
