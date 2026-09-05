<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('internships')) {
            Schema::table('internships', function (Blueprint $table) {
                if (! Schema::hasColumn('internships', 'insurance_policy_number')) {
                    $table->string('insurance_policy_number')->nullable();
                }
                if (! Schema::hasColumn('internships', 'insurance_company')) {
                    $table->string('insurance_company')->nullable()->default('MAMDA-MCMA / Assurance Scolaire');
                }
                if (! Schema::hasColumn('internships', 'insurance_verified')) {
                    $table->boolean('insurance_verified')->default(true);
                }
                if (! Schema::hasColumn('internships', 'convention_ref')) {
                    $table->string('convention_ref')->nullable();
                }
                if (! Schema::hasColumn('internships', 'convention_status')) {
                    $table->string('convention_status')->default('draft'); // draft, submitted, company_signed, school_signed, active
                }
                if (! Schema::hasColumn('internships', 'company_mentor_name')) {
                    $table->string('company_mentor_name')->nullable();
                }
                if (! Schema::hasColumn('internships', 'company_mentor_title')) {
                    $table->string('company_mentor_title')->nullable();
                }
                if (! Schema::hasColumn('internships', 'monthly_allowance')) {
                    $table->decimal('monthly_allowance', 8, 2)->nullable()->default(0.0);
                }
                if (! Schema::hasColumn('internships', 'security_token')) {
                    $table->string('security_token')->nullable()->unique();
                }
                if (! Schema::hasColumn('internships', 'company_signed_at')) {
                    $table->timestamp('company_signed_at')->nullable();
                }
                if (! Schema::hasColumn('internships', 'school_signed_at')) {
                    $table->timestamp('school_signed_at')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('internships')) {
            Schema::table('internships', function (Blueprint $table) {
                $columns = [
                    'insurance_policy_number',
                    'insurance_company',
                    'insurance_verified',
                    'convention_ref',
                    'convention_status',
                    'company_mentor_name',
                    'company_mentor_title',
                    'monthly_allowance',
                    'security_token',
                    'company_signed_at',
                    'school_signed_at',
                ];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('internships', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
