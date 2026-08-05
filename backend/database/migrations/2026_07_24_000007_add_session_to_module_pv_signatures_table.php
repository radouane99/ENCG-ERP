<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE module_pv_signatures DROP CONSTRAINT IF EXISTS module_group_year_signature_unique;');
        DB::statement('ALTER TABLE module_pv_signatures DROP CONSTRAINT IF EXISTS module_group_year_session_sig_unique;');

        if (!Schema::hasColumn('module_pv_signatures', 'session')) {
            Schema::table('module_pv_signatures', function (Blueprint $table) {
                $table->string('session', 20)->default('normale');
            });
        }

        try {
            Schema::table('module_pv_signatures', function (Blueprint $table) {
                $table->unique(['module_id', 'group_id', 'academic_year_id', 'session'], 'module_group_year_session_sig_unique');
            });
        } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE module_pv_signatures DROP CONSTRAINT IF EXISTS module_group_year_session_sig_unique;');
        if (Schema::hasColumn('module_pv_signatures', 'session')) {
            Schema::table('module_pv_signatures', function (Blueprint $table) {
                $table->dropColumn('session');
            });
        }
    }
};
