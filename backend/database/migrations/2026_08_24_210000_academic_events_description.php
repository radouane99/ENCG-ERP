<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_events', function (Blueprint $table) {
            if (! Schema::hasColumn('academic_events', 'description')) {
                $table->text('description')->nullable();
            }
            if (! Schema::hasColumn('academic_events', 'meta')) {
                $table->json('meta')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('academic_events', function (Blueprint $table) {
            if (Schema::hasColumn('academic_events', 'meta')) {
                $table->dropColumn('meta');
            }
            if (Schema::hasColumn('academic_events', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};
