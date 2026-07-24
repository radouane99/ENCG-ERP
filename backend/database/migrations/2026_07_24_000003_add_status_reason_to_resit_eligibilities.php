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
        Schema::table('resit_eligibilities', function (Blueprint $table) {
            if (!Schema::hasColumn('resit_eligibilities', 'reason')) {
                $table->string('reason')->nullable();
            }
            if (!Schema::hasColumn('resit_eligibilities', 'status')) {
                $table->string('status')->default('En attente');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resit_eligibilities', function (Blueprint $table) {
            if (Schema::hasColumn('resit_eligibilities', 'reason')) {
                $table->dropColumn('reason');
            }
            if (Schema::hasColumn('resit_eligibilities', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
