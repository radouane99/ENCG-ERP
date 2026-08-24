<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Add inscription workflow columns to students table
 *             + Create student_dossier_audit_logs table
 *
 * Covers Recommendations:
 *  - #2  Multi-step inscription statuses (inscription_status)
 *  - #5  Dossier audit log table
 *  - #6  RGPD consent (rgpd_consent_at)
 *  - #7  Auto student number tracking (inscription_validated_at)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Add inscription workflow columns to students ───────────────
        Schema::table('students', function (Blueprint $table) {
            // Multi-step inscription workflow status
            // Values: submitted | dossier_incomplet | dossier_complet | valide | inscrit | reinscrit
            if (! Schema::hasColumn('students', 'inscription_status')) {
                $table->string('inscription_status')->default('submitted')->after('status');
            }
            // Timestamps for workflow tracking
            if (! Schema::hasColumn('students', 'inscription_submitted_at')) {
                $table->timestamp('inscription_submitted_at')->nullable()->after('inscription_status');
            }
            if (! Schema::hasColumn('students', 'inscription_validated_at')) {
                $table->timestamp('inscription_validated_at')->nullable()->after('inscription_submitted_at');
            }
            if (! Schema::hasColumn('students', 'inscription_notes')) {
                $table->text('inscription_notes')->nullable()->after('inscription_validated_at');
            }
            // RGPD Consent — Loi 09-08 Maroc
            if (! Schema::hasColumn('students', 'rgpd_consent_at')) {
                $table->timestamp('rgpd_consent_at')->nullable()->after('inscription_notes');
            }
            if (! Schema::hasColumn('students', 'reglement_interieur_consent_at')) {
                $table->timestamp('reglement_interieur_consent_at')->nullable()->after('rgpd_consent_at');
            }
            // Academic year tracking
            if (! Schema::hasColumn('students', 'academic_year')) {
                $table->string('academic_year', 9)->nullable()->after('reglement_interieur_consent_at'); // e.g. 2026-2027
            }

            $table->index('inscription_status');
        });

        // ── 2. Create student_dossier_audit_logs table ────────────────────
        Schema::create('student_dossier_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('action');               // status_changed | document_uploaded | data_edited | validated | rejected
            $table->string('field_changed')->nullable(); // e.g. 'inscription_status', 'cin', 'photo_path'
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->text('comment')->nullable();    // Admin comment / note

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamps();

            $table->index(['student_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_dossier_audit_logs');

        Schema::table('students', function (Blueprint $table) {
            $columns = [
                'inscription_status', 'inscription_submitted_at',
                'inscription_validated_at', 'inscription_notes',
                'rgpd_consent_at', 'reglement_interieur_consent_at', 'academic_year',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('students', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
