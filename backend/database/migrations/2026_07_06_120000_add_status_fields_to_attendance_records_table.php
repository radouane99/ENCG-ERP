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
        Schema::table('attendance_records', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_records', 'status')) {
                $table->string('status')->default('present')->after('scanned_at'); // present, absent, late, excused
            }
            if (!Schema::hasColumn('attendance_records', 'is_justified')) {
                $table->boolean('is_justified')->default(false)->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['status', 'is_justified']);
        });
    }
};
