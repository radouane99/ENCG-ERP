<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── professors ───────────────────────────────────────────
        Schema::create('professors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('employee_number')->unique()->nullable();
            $table->string('cin')->nullable();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('first_name_ar')->nullable();
            $table->string('last_name_ar')->nullable();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('grade');                        // PES, PA, MC, PR, Doctorant
            $table->string('specialty')->nullable();        // Field of expertise
            $table->string('contract_type');                // permanent, contractual, seconded
            $table->date('hire_date')->nullable();
            $table->string('photo_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['institution_id', 'is_active']);
        });

        // ── professor_availability ───────────────────────────────
        Schema::create('professor_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->tinyInteger('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->index(['professor_id', 'day_of_week']);
        });

        // ── vacation_contracts ───────────────────────────────────
        // Vacataire (visiting lecturer) contracts
        Schema::create('vacation_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('cin')->nullable();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('first_name_ar')->nullable();
            $table->string('last_name_ar')->nullable();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('rib_number')->nullable();       // Bank account for payment
            $table->string('bank_name')->nullable();
            $table->string('external_institution')->nullable(); // If from another university
            $table->string('qualification')->nullable();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_type');                 // cm, td, tp
            $table->integer('agreed_hours');                // Total contracted hours
            $table->decimal('hourly_rate', 8, 2);          // Rate per hour (MAD)
            $table->string('status')->default('draft');    // draft, active, completed, cancelled
            $table->date('contract_start');
            $table->date('contract_end');
            $table->string('contract_file_path')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['institution_id', 'academic_year_id']);
            $table->index(['status', 'academic_year_id']);
        });

        // ── vacation_sessions ────────────────────────────────────
        // Individual teaching sessions for vacataires
        Schema::create('vacation_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vacation_contract_id')->constrained()->cascadeOnDelete();
            $table->date('session_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('hours', 4, 2);                // Computed: end - start
            $table->string('status')->default('pending');  // pending, validated, rejected
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['vacation_contract_id', 'status']);
            $table->index('session_date');
        });

        // ── vacation_payments ────────────────────────────────────
        Schema::create('vacation_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vacation_contract_id')->constrained()->cascadeOnDelete();
            $table->string('reference_number')->unique();
            $table->year('payment_year');
            $table->tinyInteger('payment_month');           // 1-12
            $table->decimal('total_hours', 8, 2);
            $table->decimal('hourly_rate', 8, 2);
            $table->decimal('gross_amount', 10, 2);        // hours × rate
            $table->decimal('tax_deduction', 10, 2)->default(0);
            $table->decimal('cnss_deduction', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2);          // gross - deductions
            $table->string('status')->default('pending');  // pending, approved, paid, cancelled
            $table->string('export_format')->nullable();   // csv, xml (for bank export)
            $table->string('export_file_path')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['institution_id', 'payment_year', 'payment_month'], 'vacation_payments_inst_year_month_idx');
            $table->index(['vacation_contract_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vacation_payments');
        Schema::dropIfExists('vacation_sessions');
        Schema::dropIfExists('vacation_contracts');
        Schema::dropIfExists('professor_availability');
        Schema::dropIfExists('professors');
    }
};
