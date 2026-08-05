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
        DB::statement('ALTER TABLE module_pv_signatures DROP CONSTRAINT IF EXISTS module_pv_signatures_module_id_group_id_academic_year_id_unique;');

        Schema::table('module_pv_signatures', function (Blueprint $table) {
            try {
                $table->dropForeign(['group_id']);
            } catch (\Throwable $e) {}

            $table->foreignId('group_id')->nullable()->change();

            $table->foreign('group_id')
                  ->references('id')->on('groups')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('module_pv_signatures', function (Blueprint $table) {
            try {
                $table->dropForeign(['group_id']);
            } catch (\Throwable $e) {}
            $table->foreignId('group_id')->nullable(false)->change();
            $table->foreign('group_id')->references('id')->on('groups')->cascadeOnDelete();
        });
    }
};
