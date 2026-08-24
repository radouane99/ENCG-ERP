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
        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'is_locked')) {
                $table->boolean('is_locked')->default(false);
            }
            if (! Schema::hasColumn('exams', 'locked_at')) {
                $table->timestamp('locked_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (Schema::hasColumn('exams', 'is_locked')) {
                $table->dropColumn('is_locked');
            }
            if (Schema::hasColumn('exams', 'locked_at')) {
                $table->dropColumn('locked_at');
            }
        });
    }
};
