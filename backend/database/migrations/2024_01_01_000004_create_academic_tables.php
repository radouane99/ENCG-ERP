<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── academic_years ───────────────────────────────────────
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('label');                        // 2024-2025
            $table->year('start_year');
            $table->year('end_year');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
            $table->boolean('is_locked')->default(false);
            $table->timestamps();

            $table->unique(['institution_id', 'start_year']);
        });

        // ── semesters ────────────────────────────────────────────
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('name');                         // Semestre 1
            $table->tinyInteger('number');                  // 1, 2
            $table->date('start_date');
            $table->date('end_date');
            $table->date('exam_start_date')->nullable();
            $table->date('exam_end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->timestamps();
        });

        // ── filieres ─────────────────────────────────────────────
        Schema::create('filieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');                         // Gestion Financière et Comptable
            $table->string('name_ar')->nullable();
            $table->string('code')->unique();               // GFC
            $table->string('type');                         // licence, master, doctorat, grande_ecole
            $table->tinyInteger('duration_years')->default(3);
            $table->string('accreditation_number')->nullable();
            $table->date('accreditation_expiry')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['institution_id', 'is_active']);
        });

        // ── specialities ─────────────────────────────────────────
        Schema::create('specialities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('name_ar')->nullable();
            $table->string('code')->unique();
            $table->tinyInteger('semester_start')->default(5); // When specialisation starts
            $table->timestamps();
        });

        // ── groups ───────────────────────────────────────────────
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('speciality_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');                         // GFC-S1-G1
            $table->tinyInteger('semester_number');
            $table->integer('capacity')->default(35);
            $table->integer('current_count')->default(0);
            $table->timestamps();

            $table->index(['filiere_id', 'academic_year_id']);
        });

        // ── modules ──────────────────────────────────────────────
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
            $table->foreignId('speciality_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('name_ar')->nullable();
            $table->string('code')->unique();
            $table->tinyInteger('semester_number');
            $table->decimal('coefficient', 5, 2)->default(1.0);
            $table->decimal('credit_hours', 5, 1)->default(0);
            $table->integer('hours_cm')->default(0);        // Cours magistral
            $table->integer('hours_td')->default(0);        // Travaux dirigés
            $table->integer('hours_tp')->default(0);        // Travaux pratiques
            $table->boolean('is_elective')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['filiere_id', 'semester_number']);
        });

        // ── module_prerequisites ──────────────────────────────────
        Schema::create('module_prerequisites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prerequisite_module_id')->constrained('modules')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['module_id', 'prerequisite_module_id']);
        });

        // ── module_professor ─────────────────────────────────────
        Schema::create('module_professor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('professor_id');     // Can be professor or vacataire
            $table->string('professor_type');               // App\Domain\HR\Models\Professor
            $table->string('session_type');                 // cm, td, tp
            $table->integer('assigned_hours')->default(0);
            $table->timestamps();

            $table->index(['module_id', 'academic_year_id']);
        });

        // ── rooms ────────────────────────────────────────────────
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('campus_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');                         // Amphithéâtre A, Salle 301
            $table->string('code')->unique();
            $table->string('type');                         // amphitheater, classroom, lab, conference
            $table->integer('capacity')->default(30);
            $table->boolean('has_projector')->default(false);
            $table->boolean('has_ac')->default(false);
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        // ── room_equipment ───────────────────────────────────────
        Schema::create('room_equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->integer('quantity')->default(1);
            $table->string('condition')->default('good');   // good, fair, broken
            $table->timestamps();
        });

        // ── schedules ────────────────────────────────────────────
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('professor_id');
            $table->string('professor_type');
            $table->tinyInteger('day_of_week');             // 1=Mon, 5=Fri, 6=Sat
            $table->time('start_time');
            $table->time('end_time');
            $table->string('session_type');                 // cm, td, tp
            $table->string('recurrence')->default('weekly'); // weekly, biweekly_a, biweekly_b
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['group_id', 'day_of_week', 'semester_id']);
            $table->index(['room_id', 'day_of_week', 'start_time']);
            $table->index(['professor_id', 'professor_type', 'day_of_week']);
        });

        // ── schedule_changes ─────────────────────────────────────
        Schema::create('schedule_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained()->cascadeOnDelete();
            $table->date('change_date');
            $table->string('type');                         // cancelled, rescheduled, room_change
            $table->foreignId('new_room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->time('new_start_time')->nullable();
            $table->time('new_end_time')->nullable();
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_changes');
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('room_equipment');
        Schema::dropIfExists('rooms');
        Schema::dropIfExists('module_professor');
        Schema::dropIfExists('module_prerequisites');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('specialities');
        Schema::dropIfExists('filieres');
        Schema::dropIfExists('semesters');
        Schema::dropIfExists('academic_years');
    }
};
