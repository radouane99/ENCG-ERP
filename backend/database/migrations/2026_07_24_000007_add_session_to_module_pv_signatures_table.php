<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('module_pv_signatures', function (Blueprint $table) {
            $table->string('session', 20)->default('normale');
            
            // Re-create unique constraint to include session
            try {
                $table->dropUnique('module_group_year_signature_unique');
            } catch (\Throwable $e) {}

            $table->unique(['module_id', 'group_id', 'academic_year_id', 'session'], 'module_group_year_session_sig_unique');
        });
    }

    public function down(): void
    {
        Schema::table('module_pv_signatures', function (Blueprint $table) {
            try {
                $table->dropUnique('module_group_year_session_sig_unique');
            } catch (\Throwable $e) {}

            $table->dropColumn('session');
            $table->unique(['module_id', 'group_id', 'academic_year_id'], 'module_group_year_signature_unique');
        });
    }
};
