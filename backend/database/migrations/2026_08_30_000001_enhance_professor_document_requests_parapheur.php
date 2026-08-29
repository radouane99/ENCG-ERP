<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('professor_document_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('professor_document_requests', 'department_id')) {
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            }
            if (! Schema::hasColumn('professor_document_requests', 'department_visa')) {
                $table->string('department_visa')->default('pending'); // pending, favorable, unfavorable
            }
            if (! Schema::hasColumn('professor_document_requests', 'department_visa_by')) {
                $table->foreignId('department_visa_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('professor_document_requests', 'department_visa_at')) {
                $table->timestamp('department_visa_at')->nullable();
            }
            if (! Schema::hasColumn('professor_document_requests', 'department_notes')) {
                $table->text('department_notes')->nullable();
            }
            if (! Schema::hasColumn('professor_document_requests', 'direction_decision')) {
                $table->string('direction_decision')->default('pending'); // pending, approved, rejected
            }
            if (! Schema::hasColumn('professor_document_requests', 'direction_signed_by')) {
                $table->string('direction_signed_by')->nullable();
            }
            if (! Schema::hasColumn('professor_document_requests', 'direction_signed_at')) {
                $table->timestamp('direction_signed_at')->nullable();
            }
            if (! Schema::hasColumn('professor_document_requests', 'direction_notes')) {
                $table->text('direction_notes')->nullable();
            }
            if (! Schema::hasColumn('professor_document_requests', 'vehicle_registration')) {
                $table->string('vehicle_registration')->nullable();
            }
            if (! Schema::hasColumn('professor_document_requests', 'expense_coverage')) {
                $table->string('expense_coverage')->default('sans_frais'); // charge_ecole, charge_organisme_accueil, sans_frais
            }
            if (! Schema::hasColumn('professor_document_requests', 'mission_category')) {
                $table->string('mission_category')->nullable(); // colloque_international, seminaire_national, jury_these, visite_entreprise, reunion_pedagogique
            }
            if (! Schema::hasColumn('professor_document_requests', 'qr_token')) {
                $table->string('qr_token')->nullable()->unique();
            }
            if (! Schema::hasColumn('professor_document_requests', 'digital_seal')) {
                $table->string('digital_seal')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('professor_document_requests', function (Blueprint $table) {
            $columns = [
                'department_id',
                'department_visa',
                'department_visa_by',
                'department_visa_at',
                'department_notes',
                'direction_decision',
                'direction_signed_by',
                'direction_signed_at',
                'direction_notes',
                'vehicle_registration',
                'expense_coverage',
                'mission_category',
                'qr_token',
                'digital_seal',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('professor_document_requests', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
