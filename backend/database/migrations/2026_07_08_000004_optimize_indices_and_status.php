<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add composite indices for heavy query patterns
        if (Schema::hasTable('schedules')) {
            Schema::table('schedules', function (Blueprint $table) {
                // Check if index already exists to prevent SQLite errors
                $indexes = Schema::getIndexes('schedules');
                $hasIndex = false;
                foreach ($indexes as $index) {
                    if ($index['name'] === 'schedules_room_id_day_of_week_start_time_index') {
                        $hasIndex = true;
                        break;
                    }
                }
                if (!$hasIndex) {
                    // Only index if columns exist
                    if (Schema::hasColumn('schedules', 'room_id') && 
                        Schema::hasColumn('schedules', 'day_of_week') && 
                        Schema::hasColumn('schedules', 'start_time')) {
                        
                        $table->index(['room_id', 'day_of_week', 'start_time']);
                    }
                }
            });
        }
    }

    public function down(): void
    {
    }
};
