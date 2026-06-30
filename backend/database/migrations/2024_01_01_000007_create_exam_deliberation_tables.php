<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── attendance_sessions ──────────────────────────────────
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('professor_id');
            $table->string('professor_type');
            $table->date('session_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('session_type');                 // cm, td, tp
            $table->string('room')->nullable();
            $table->boolean('is_locked')->default(false);  // Prevent further edits
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['group_id', 'session_date']);
            $table->index(['module_id', 'academic_year_id']);
        });

        // ── attendances ──────────────────────────────────────────
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('present');  // present, absent, late, excused
            $table->boolean('is_justified')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['attendance_session_id', 'student_id']);
            $table->index(['student_id', 'status']);
        });

        // ── absence_justifications ───────────────────────────────
        Schema::create('absence_justifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('reason');                       // medical, family, sports, other
            $table->text('description')->nullable();
            $table->string('document_path')->nullable();
            $table->string('status')->default('pending');  // pending, approved, rejected
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });

        // ── exam_sessions ────────────────────────────────────────
        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->string('name');                         // Session Normale S1 2024-25
            $table->string('type');                         // normale, rattrapage, jury
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->boolean('is_locked')->default(false);  // Grades are final
            $table->timestamps();

            $table->index(['institution_id', 'academic_year_id', 'type']);
        });

        // ── exams ────────────────────────────────────────────────
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->nullable()->constrained()->nullOnDelete();
            $table->date('exam_date')->nullable();
            $table->time('start_time')->nullable();
            $table->integer('duration_minutes')->default(120);
            $table->string('type');                         // written, oral, project, practical
            $table->boolean('grades_published')->default(false);
            $table->timestamps();

            $table->index(['exam_session_id', 'module_id']);
        });

        // ── grade_components ─────────────────────────────────────
        // Defines grading formula per module (CC, TP, Projet, Final)
        Schema::create('grade_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_session_id')->constrained()->cascadeOnDelete();
            $table->string('name');                         // CC, TP, Projet, Examen Final
            $table->string('code');                         // cc, tp, project, final
            $table->decimal('weight', 5, 2);                // e.g. 25.00 (%)
            $table->decimal('max_grade', 5, 2)->default(20.0);
            $table->boolean('is_eliminatory')->default(false);
            $table->decimal('eliminatory_threshold', 5, 2)->nullable(); // e.g. 8/20
            $table->timestamps();

            $table->index(['module_id', 'exam_session_id']);
        });

        // ── grades ───────────────────────────────────────────────
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_component_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_session_id')->constrained()->cascadeOnDelete();
            $table->decimal('score', 5, 2)->nullable();     // NULL = absent
            $table->boolean('is_absent')->default(false);
            $table->boolean('is_justified_absence')->default(false);
            $table->decimal('final_score', 5, 2)->nullable(); // Score after jury
            $table->text('notes')->nullable();
            $table->foreignId('entered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('entered_at')->nullable();
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();

            $table->unique(['grade_component_id', 'student_id', 'exam_session_id']);
            $table->index(['student_id', 'exam_session_id']);
        });

        // ── deliberations ────────────────────────────────────────
        Schema::create('deliberations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');                         // semester, annual, rattrapage
            $table->string('status')->default('pending');  // pending, in_progress, completed, locked
            $table->date('deliberation_date')->nullable();
            $table->text('pv_content')->nullable();         // Procès-verbal
            $table->string('pv_file_path')->nullable();
            $table->foreignId('president_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // ── deliberation_members ─────────────────────────────────
        Schema::create('deliberation_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deliberation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role');                         // president, member, secretary
            $table->timestamps();
        });

        // ── deliberation_decisions ───────────────────────────────
        Schema::create('deliberation_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deliberation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();

            // Computed averages
            $table->decimal('semester_average', 5, 2)->nullable();
            $table->decimal('annual_average', 5, 2)->nullable();
            $table->decimal('compensated_average', 5, 2)->nullable();

            // Decision
            $table->string('decision');                     // admitted, retake, excluded, compensated
            $table->boolean('was_compensated')->default(false);
            $table->boolean('was_rachat')->default(false);  // jury rachat
            $table->string('mention')->nullable();           // Passable, AB, Bien, TB
            $table->tinyInteger('next_semester')->nullable();
            $table->text('jury_notes')->nullable();
            $table->timestamps();

            $table->unique(['deliberation_id', 'student_id']);
            $table->index(['student_id', 'deliberation_id']);
        });

        // ── compensation_rules ───────────────────────────────────
        Schema::create('compensation_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('filiere_id')->nullable()->constrained()->nullOnDelete();
            $table->tinyInteger('semester_number')->nullable(); // null = applies to all
            $table->string('rule_type');                    // between_modules, between_semesters
            $table->decimal('minimum_average', 5, 2)->default(10.0);
            $table->decimal('minimum_module_grade', 5, 2)->default(7.0);
            $table->decimal('max_deficit_allowed', 5, 2)->default(3.0);
            $table->boolean('eliminatory_blocks', 10, 2)->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── compensation_results ─────────────────────────────────
        Schema::create('compensation_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deliberation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->decimal('original_score', 5, 2);
            $table->decimal('compensated_from_score', 5, 2)->nullable();
            $table->string('compensation_source')->nullable(); // which module/semester used
            $table->boolean('is_applied')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compensation_results');
        Schema::dropIfExists('compensation_rules');
        Schema::dropIfExists('deliberation_decisions');
        Schema::dropIfExists('deliberation_members');
        Schema::dropIfExists('deliberations');
        Schema::dropIfExists('grades');
        Schema::dropIfExists('grade_components');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('exam_sessions');
        Schema::dropIfExists('absence_justifications');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('attendance_sessions');
    }
};
