<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'has_disability')) {
                $table->boolean('has_disability')->default(false)->after('status');
            }
            if (!Schema::hasColumn('applications', 'disability_type')) {
                $table->string('disability_type', 100)->nullable()->after('has_disability');
            }
            if (!Schema::hasColumn('applications', 'disability_details')) {
                $table->string('disability_details', 500)->nullable()->after('disability_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['has_disability', 'disability_type', 'disability_details']);
        });
    }
};
