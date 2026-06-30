<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── final_projects ───────────────────────────────────────
        Schema::create('final_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->text('description')->nullable();
            $table->string('type')->default('pfe');         // pfe, memoire, these
            $table->string('company_name')->nullable();      // If industrial PFE
            $table->string('company_city')->nullable();
            $table->string('status')->default('submitted'); // submitted, in_progress, defended, validated
            $table->string('report_path')->nullable();
            $table->timestamps();

            $table->index(['institution_id', 'academic_year_id']);
        });

        // ── project_supervisors ──────────────────────────────────
        Schema::create('project_supervisors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('final_project_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('professor_id');
            $table->string('professor_type');               // Professor or external
            $table->string('role');                         // supervisor, co_supervisor
            $table->boolean('is_external')->default(false);
            $table->string('external_name')->nullable();
            $table->string('external_institution')->nullable();
            $table->timestamps();
        });

        // ── project_defenses ─────────────────────────────────────
        Schema::create('project_defenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('final_project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('scheduled_at')->nullable();
            $table->integer('duration_minutes')->default(30);
            $table->string('status')->default('scheduled'); // scheduled, completed, postponed
            $table->decimal('presentation_score', 5, 2)->nullable();
            $table->decimal('report_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->string('mention')->nullable();
            $table->text('jury_remarks')->nullable();
            $table->timestamps();
        });

        // ── defense_juries ───────────────────────────────────────
        Schema::create('defense_juries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_defense_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('professor_id');
            $table->string('professor_type');
            $table->string('role');                         // president, member, supervisor
            $table->boolean('is_external')->default(false);
            $table->string('external_name')->nullable();
            $table->timestamps();
        });

        // ── internships ──────────────────────────────────────────
        Schema::create('internships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('type');                         // initiation, application, fin_etudes
            $table->string('company_name');
            $table->string('company_address')->nullable();
            $table->string('company_city')->nullable();
            $table->string('supervisor_name')->nullable();
            $table->string('supervisor_email')->nullable();
            $table->string('supervisor_phone')->nullable();
            $table->string('position_title')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('agreement_file_path')->nullable();
            $table->string('status')->default('pending');  // pending, active, completed, cancelled
            $table->foreignId('professor_supervisor_id')->nullable()->constrained('professors')->nullOnDelete();
            $table->timestamps();

            $table->index(['institution_id', 'academic_year_id']);
            $table->index(['student_id', 'type']);
        });

        // ── internship_reports ───────────────────────────────────
        Schema::create('internship_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->string('status')->default('submitted'); // submitted, approved, rejected
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('feedback')->nullable();
            $table->timestamps();
        });

        // ── internship_evaluations ───────────────────────────────
        Schema::create('internship_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->constrained()->cascadeOnDelete();
            $table->string('evaluator_type');               // company, professor
            $table->decimal('technical_score', 5, 2)->nullable();
            $table->decimal('behavior_score', 5, 2)->nullable();
            $table->decimal('initiative_score', 5, 2)->nullable();
            $table->decimal('report_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->string('mention')->nullable();
            $table->text('comments')->nullable();
            $table->timestamps();
        });

        // ── document_templates ───────────────────────────────────
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();               // enrollment_certificate, transcript
            $table->string('type');                         // student, professor
            $table->string('category');                     // certificate, attestation, order
            $table->text('html_template');                  // Blade/HTML template
            $table->text('html_template_ar')->nullable();
            $table->boolean('has_qr')->default(true);
            $table->boolean('has_signature')->default(true);
            $table->boolean('has_stamp')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── document_requests ────────────────────────────────────
        Schema::create('document_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_template_id')->constrained()->cascadeOnDelete();
            $table->string('reference_number')->unique();
            $table->string('status')->default('pending');  // pending, approved, rejected, generated
            $table->string('language')->default('fr');      // fr, ar
            $table->json('additional_data')->nullable();    // Extra template variables
            $table->text('rejection_reason')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['institution_id', 'status']);
        });

        // ── generated_documents ──────────────────────────────────
        Schema::create('generated_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_request_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->string('verification_token')->unique();
            $table->string('verification_url');
            $table->string('qr_code_path')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->integer('download_count')->default(0);
            $table->timestamps();
        });

        // ── diplomas ─────────────────────────────────────────────
        Schema::create('diplomas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('diploma_number')->unique();
            $table->string('diploma_type');                 // licence, master, doctorat
            $table->date('graduation_date');
            $table->decimal('final_average', 5, 2)->nullable();
            $table->string('mention')->nullable();
            $table->string('file_path')->nullable();
            $table->string('verification_token')->unique();
            $table->boolean('is_issued')->default(false);
            $table->timestamp('issued_at')->nullable();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // ── diploma_verifications ────────────────────────────────
        Schema::create('diploma_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('diploma_id')->constrained()->cascadeOnDelete();
            $table->string('verifier_name')->nullable();
            $table->string('verifier_organization')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index('diploma_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diploma_verifications');
        Schema::dropIfExists('diplomas');
        Schema::dropIfExists('generated_documents');
        Schema::dropIfExists('document_requests');
        Schema::dropIfExists('document_templates');
        Schema::dropIfExists('internship_evaluations');
        Schema::dropIfExists('internship_reports');
        Schema::dropIfExists('internships');
        Schema::dropIfExists('defense_juries');
        Schema::dropIfExists('project_defenses');
        Schema::dropIfExists('project_supervisors');
        Schema::dropIfExists('final_projects');
    }
};
