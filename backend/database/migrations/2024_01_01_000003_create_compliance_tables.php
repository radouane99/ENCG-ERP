<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── audit_logs ───────────────────────────────────────────
        // Moroccan Law 09-08 — comprehensive audit trail
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');                       // created, updated, deleted, viewed, exported
            $table->string('auditable_type');               // Model class
            $table->unsignedBigInteger('auditable_id');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('url')->nullable();
            $table->string('tags')->nullable();             // Comma-separated tags
            $table->timestamps();

            $table->index(['auditable_type', 'auditable_id']);
            $table->index(['user_id', 'created_at']);
            $table->index('action');
        });

        // ── consent_logs ─────────────────────────────────────────
        // Track explicit consent for data categories (Law 09-08 Art. 4)
        Schema::create('consent_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('data_category');                // academic_data, health_data, financial_data
            $table->string('purpose');                      // Purpose of data collection
            $table->boolean('is_granted')->default(false);
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'data_category']);
        });

        // ── data_access_logs ─────────────────────────────────────
        // Track who accessed what personal data (Law 09-08 Art. 25)
        Schema::create('data_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('accessor_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('subject_type');                 // Student, Professor
            $table->unsignedBigInteger('subject_id');
            $table->string('data_type');                    // profile, grades, medical, financial
            $table->string('access_reason');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['subject_type', 'subject_id']);
            $table->index(['accessor_user_id', 'created_at']);
        });

        // ── retention_policies ───────────────────────────────────
        // Data retention rules per data category (Law 09-08 Art. 31)
        Schema::create('retention_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('data_category');
            $table->string('model_class');
            $table->integer('retention_days');
            $table->string('action_after')->default('archive'); // archive, anonymize, delete
            $table->boolean('is_active')->default(true);
            $table->text('legal_basis')->nullable();
            $table->timestamps();
        });

        // ── data_export_requests ─────────────────────────────────
        // DSAR — Data Subject Access Requests (Law 09-08 Art. 7)
        Schema::create('data_export_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending, processing, completed, rejected
            $table->string('export_format')->default('json'); // json, pdf
            $table->string('file_path')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_export_requests');
        Schema::dropIfExists('retention_policies');
        Schema::dropIfExists('data_access_logs');
        Schema::dropIfExists('consent_logs');
        Schema::dropIfExists('audit_logs');
    }
};
