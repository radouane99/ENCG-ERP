<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Drops massar_code column from students table to eliminate data redundancy.
     * CNE serves as the single source of truth for the Moroccan student code (Massar).
     */
    public function up(): void
    {
        if (Schema::hasTable('students') && Schema::hasColumn('students', 'massar_code')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('massar_code');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('students') && ! Schema::hasColumn('students', 'massar_code')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('massar_code')->nullable()->after('cne');
            });
        }
    }
};
