<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('rooms')) {
            Schema::table('rooms', function (Blueprint $table) {
                if (!Schema::hasColumn('rooms', 'exam_capacity')) {
                    $table->integer('exam_capacity')->nullable()->after('capacity');
                }
            });

            // Set default exam_capacity to floor(capacity / 2) for existing rooms
            DB::statement('UPDATE rooms SET exam_capacity = FLOOR(capacity / 2) WHERE exam_capacity IS NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('rooms')) {
            Schema::table('rooms', function (Blueprint $table) {
                if (Schema::hasColumn('rooms', 'exam_capacity')) {
                    $table->dropColumn('exam_capacity');
                }
            });
        }
    }
};
