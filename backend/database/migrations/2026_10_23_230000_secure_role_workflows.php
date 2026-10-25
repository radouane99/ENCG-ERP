<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_publications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('assessment_id')->unique()->constrained()->restrictOnDelete();
            $t->timestamp('published_at');
            $t->timestamp('appeals_until');
            $t->foreignId('published_by')->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
        Schema::create('specialty_allocation_runs', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('institution_id')->constrained()->restrictOnDelete();
            $t->foreignId('source_year_id')->constrained('academic_years')->restrictOnDelete();
            $t->foreignId('target_year_id')->constrained('academic_years')->restrictOnDelete();
            $t->json('assignments');
            $t->string('fingerprint', 64);
            $t->string('status')->default('preview');
            $t->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
        Schema::create('module_pv_signature_archives', function (Blueprint $t) {
            $t->id();
            $t->foreignId('module_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $t->json('signature_snapshot');
            $t->text('reason');
            $t->foreignId('revoked_by')->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
        Schema::create('student_renewals', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $t->foreignId('source_pathway_id')->nullable()->constrained('student_pathways')->restrictOnDelete();
            $t->foreignId('decision_id')->nullable()->constrained('deliberation_decisions')->restrictOnDelete();
            $t->foreignId('filiere_id')->constrained()->restrictOnDelete();
            $t->unsignedTinyInteger('target_semester');
            $t->string('receipt_reference')->unique();
            $t->timestamp('confirmed_at');
            $t->timestamps();
            $t->unique(['student_id', 'academic_year_id']);
        });
        Schema::create('tuition_invoices', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $t->foreignId('filiere_id')->constrained()->restrictOnDelete();
            $t->decimal('amount', 12, 2);
            $t->decimal('paid_amount', 12, 2)->default(0);
            $t->string('reference')->unique();
            $t->string('status')->default('pending');
            $t->date('due_on');
            $t->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $t->timestamps();
            $t->unique(['student_id', 'academic_year_id', 'filiere_id']);
        });
        Schema::create('tuition_payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('invoice_id')->constrained('tuition_invoices')->restrictOnDelete();
            $t->decimal('amount', 12, 2);
            $t->string('provider');
            $t->string('reference')->unique();
            $t->text('verification_note');
            $t->foreignId('verified_by')->constrained('users')->restrictOnDelete();
            $t->timestamp('verified_at');
            $t->timestamps();
        });
        Schema::table('professor_availabilities', function (Blueprint $t) {
            if (! Schema::hasColumn('professor_availabilities', 'notes')) {
                $t->text('notes')->nullable();
            }
        });
        DB::statement('CREATE UNIQUE INDEX professor_availability_annual_unique ON professor_availabilities (professor_id, academic_year_id) WHERE semester_id IS NULL AND day_of_week IS NULL');
        Schema::table('internships', function (Blueprint $t) {
            $t->foreignId('academic_year_id')->nullable()->constrained()->restrictOnDelete();
            foreach (['company_address', 'company_city', 'supervisor_name', 'supervisor_email', 'supervisor_phone', 'position_title'] as $field) {
                $t->string($field)->nullable();
            }
            $t->foreignId('school_signed_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->foreignId('insurance_verified_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->string('company_token_hash', 64)->nullable()->unique();
            $t->timestamp('company_token_expires_at')->nullable();
            $t->string('company_signer_name')->nullable();
            $t->string('company_signer_email')->nullable();
        });
        Schema::table('final_projects', function (Blueprint $t) {
            $t->foreignId('academic_year_id')->nullable()->constrained()->restrictOnDelete();
            $t->timestamp('archived_at')->nullable();
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Restore a verified backup; role workflow history must not be destructively rolled back.');
    }
};
