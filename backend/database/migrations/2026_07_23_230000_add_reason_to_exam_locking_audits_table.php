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
        if (Schema::hasTable('exam_locking_audits') && !Schema::hasColumn('exam_locking_audits', 'reason')) {
            Schema::table('exam_locking_audits', function (Blueprint $table) {
                $table->string('reason')->nullable()->after('new_phase');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('exam_locking_audits') && Schema::hasColumn('exam_locking_audits', 'reason')) {
            Schema::table('exam_locking_audits', function (Blueprint $table) {
                $table->dropColumn('reason');
            });
        }
    }
};
