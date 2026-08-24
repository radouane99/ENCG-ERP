<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('academic_rules')) {
            DB::table('academic_rules')->update(['minimum_module_grade' => 6.0]);
        }

        Schema::table('deliberations', function (Blueprint $table) {
            if (! Schema::hasColumn('deliberations', 'is_sealed')) {
                $table->boolean('is_sealed')->default(false);
            }
            if (! Schema::hasColumn('deliberations', 'seal_hash')) {
                $table->string('seal_hash', 64)->nullable();
            }
            if (! Schema::hasColumn('deliberations', 'sealed_at')) {
                $table->timestamp('sealed_at')->nullable();
            }
        });

        if (! Schema::hasTable('deliberation_votes')) {
            Schema::create('deliberation_votes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('deliberation_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('decision');
                $table->text('comment')->nullable();
                $table->timestamps();
                $table->unique(['deliberation_id', 'user_id']);
            });
        }

        if (! Schema::hasTable('deliberation_reopen_requests')) {
            Schema::create('deliberation_reopen_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('deliberation_id')->constrained()->cascadeOnDelete();
                $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
                $table->foreignId('second_approver_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('motif');
                $table->string('status')->default('pending');
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('rooms', function (Blueprint $table) {
            if (! Schema::hasColumn('rooms', 'is_out_of_service')) {
                $table->boolean('is_out_of_service')->default(false);
            }
        });

        Schema::table('vacation_contracts', function (Blueprint $table) {
            if (! Schema::hasColumn('vacation_contracts', 'max_hours_per_module')) {
                $table->unsignedSmallInteger('max_hours_per_module')->default(45);
            }
            if (! Schema::hasColumn('vacation_contracts', 'approved_by_dept_at')) {
                $table->timestamp('approved_by_dept_at')->nullable();
            }
            if (! Schema::hasColumn('vacation_contracts', 'approved_by_hr_at')) {
                $table->timestamp('approved_by_hr_at')->nullable();
            }
            if (! Schema::hasColumn('vacation_contracts', 'approved_by_dept_id')) {
                $table->foreignId('approved_by_dept_id')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('vacation_contracts', 'approved_by_hr_id')) {
                $table->foreignId('approved_by_hr_id')->nullable()->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliberation_reopen_requests');
        Schema::dropIfExists('deliberation_votes');
    }
};
