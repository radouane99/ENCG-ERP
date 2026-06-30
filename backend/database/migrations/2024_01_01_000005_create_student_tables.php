<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── students ─────────────────────────────────────────────
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('student_number')->unique();     // 20240001
            $table->string('cne')->unique()->nullable();    // Code National Étudiant
            $table->string('cin')->nullable();              // Carte d'identité nationale
            $table->string('massar_code')->nullable();      // Code Massar (baccalauréat)

            // Personal information
            $table->string('first_name');
            $table->string('last_name');
            $table->string('first_name_ar')->nullable();
            $table->string('last_name_ar')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('birth_city')->nullable();
            $table->string('birth_country')->default('MA');
            $table->string('gender');                       // male, female
            $table->string('nationality')->default('Marocaine');
            $table->string('photo_path')->nullable();

            // Contact
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('region')->nullable();
            $table->string('postal_code')->nullable();

            // Emergency contact
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relation')->nullable();

            // Academic status
            $table->string('status')->default('active');   // active, suspended, graduated, withdrawn
            $table->string('scholarship_type')->nullable(); // none, excellence, social, state
            $table->boolean('has_disability')->default(false);
            $table->text('disability_details')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['institution_id', 'status']);
            $table->index('student_number');
            $table->index('cne');
            $table->index(['last_name', 'first_name']);
        });

        // ── student_documents ────────────────────────────────────
        Schema::create('student_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('type');                         // cin, baccalaureate, photo, diploma
            $table->string('file_path');
            $table->string('original_filename')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedInteger('file_size')->nullable();
            $table->string('status')->default('pending');  // pending, verified, rejected
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'type']);
        });

        // ── student_pathways ─────────────────────────────────────
        Schema::create('student_pathways', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
            $table->foreignId('speciality_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->tinyInteger('current_semester');
            $table->boolean('is_current')->default(false);
            $table->timestamps();

            $table->index(['student_id', 'is_current']);
        });

        // ── student_academic_history ─────────────────────────────
        Schema::create('student_academic_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('institution_name');
            $table->string('diploma_type');                 // bac, bac+2, licence
            $table->string('speciality')->nullable();
            $table->string('mention')->nullable();          // Bien, Très Bien
            $table->year('graduation_year')->nullable();
            $table->decimal('average', 5, 2)->nullable();
            $table->timestamps();
        });

        // ── admission_campaigns ──────────────────────────────────
        Schema::create('admission_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('status')->default('draft');    // draft, open, closed, archived
            $table->date('open_date');
            $table->date('close_date');
            $table->date('result_date')->nullable();
            $table->integer('target_capacity');
            $table->integer('accepted_count')->default(0);
            $table->text('conditions')->nullable();
            $table->boolean('requires_entrance_exam')->default(false);
            $table->timestamps();

            $table->index(['institution_id', 'status']);
        });

        // ── applications ─────────────────────────────────────────
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_campaign_id')->constrained()->cascadeOnDelete();
            $table->string('reference_number')->unique();   // ENCG-GFC-2024-000001
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('cin')->nullable();
            $table->string('cne')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('bac_mention')->nullable();
            $table->decimal('bac_average', 5, 2)->nullable();
            $table->year('bac_year')->nullable();
            $table->string('bac_series')->nullable();       // Sciences Math, Sciences Ex
            $table->string('status')->default('submitted'); // submitted, under_review, accepted, rejected, waitlisted, enrolled
            $table->tinyInteger('ranking')->nullable();
            $table->decimal('entrance_exam_score', 5, 2)->nullable();
            $table->decimal('selection_score', 5, 2)->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['admission_campaign_id', 'status']);
            $table->index('reference_number');
        });

        // ── application_documents ────────────────────────────────
        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('type');                         // cin, bac_diploma, transcripts, photo
            $table->string('file_path');
            $table->string('original_filename')->nullable();
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── student_registrations ────────────────────────────────
        Schema::create('student_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->tinyInteger('semester_number');
            $table->string('status')->default('pending');  // pending, academic_validated, admin_validated, rejected
            $table->string('registration_type');           // initial, re_enrollment
            $table->decimal('tuition_amount', 10, 2)->nullable();
            $table->string('payment_status')->default('unpaid'); // unpaid, partial, paid
            $table->timestamp('academic_validated_at')->nullable();
            $table->foreignId('academic_validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('admin_validated_at')->nullable();
            $table->foreignId('admin_validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

                            $table->unique(['student_id', 'academic_year_id', 'semester_number'], 'student_reg_unique');
            $table->index(['academic_year_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_registrations');
        Schema::dropIfExists('application_documents');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('admission_campaigns');
        Schema::dropIfExists('student_academic_history');
        Schema::dropIfExists('student_pathways');
        Schema::dropIfExists('student_documents');
        Schema::dropIfExists('students');
    }
};
