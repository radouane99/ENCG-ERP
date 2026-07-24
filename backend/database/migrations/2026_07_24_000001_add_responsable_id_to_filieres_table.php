<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('filieres', function (Blueprint $table) {
            if (Schema::hasColumn('filieres', 'responsable_id')) {
                try {
                    $table->dropForeign(['responsable_id']);
                } catch (\Throwable $e) {}
                try {
                    $table->dropColumn('responsable_id');
                } catch (\Throwable $e) {}
            }
        });

        Schema::table('filieres', function (Blueprint $table) {
            if (!Schema::hasColumn('filieres', 'responsable_id')) {
                $table->uuid('responsable_id')->nullable();
                $table->foreign('responsable_id')->references('id')->on('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('filieres', function (Blueprint $table) {
            if (Schema::hasColumn('filieres', 'responsable_id')) {
                $table->dropForeign(['responsable_id']);
                $table->dropColumn('responsable_id');
            }
        });
    }
};
