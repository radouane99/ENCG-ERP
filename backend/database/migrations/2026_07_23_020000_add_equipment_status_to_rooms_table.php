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
                if (!Schema::hasColumn('rooms', 'equipment_status')) {
                    $table->json('equipment_status')->nullable()->after('is_available');
                }
            });

            // Set default status for existing rooms
            $defaultStatus = json_encode([
                'projector' => 'ok',
                'ac' => 'ok',
                'sound' => 'ok',
                'pc_lab' => 'ok'
            ]);
            DB::statement("UPDATE rooms SET equipment_status = '$defaultStatus' WHERE equipment_status IS NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('rooms')) {
            Schema::table('rooms', function (Blueprint $table) {
                if (Schema::hasColumn('rooms', 'equipment_status')) {
                    $table->dropColumn('equipment_status');
                }
            });
        }
    }
};
