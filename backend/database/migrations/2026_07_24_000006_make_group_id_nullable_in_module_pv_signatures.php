<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('module_pv_signatures', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->dropUnique('module_group_year_signature_unique');

            $table->foreignId('group_id')->nullable()->change();

            $table->foreign('group_id')
                  ->references('id')->on('groups')
                  ->nullOnDelete();

            $table->unique(['module_id', 'group_id', 'academic_year_id'], 'module_group_year_signature_unique');
        });
    }

    public function down(): void
    {
        Schema::table('module_pv_signatures', function (Blueprint $table) {
            $table->dropUnique('module_group_year_signature_unique');
            $table->dropForeign(['group_id']);
            $table->foreignId('group_id')->nullable(false)->change();
            $table->foreign('group_id')->references('id')->on('groups')->cascadeOnDelete();
            $table->unique(['module_id', 'group_id', 'academic_year_id'], 'module_group_year_signature_unique');
        });
    }
};
