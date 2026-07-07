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
        Schema::table('schedule_changes', function (Blueprint $table) {
            // Rename change_date to original_date
            $table->renameColumn('change_date', 'original_date');
            
            // Add new_date (nullable, as it's only needed if type is 'rescheduled')
            $table->date('new_date')->nullable()->after('original_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedule_changes', function (Blueprint $table) {
            $table->dropColumn('new_date');
            $table->renameColumn('original_date', 'change_date');
        });
    }
};
