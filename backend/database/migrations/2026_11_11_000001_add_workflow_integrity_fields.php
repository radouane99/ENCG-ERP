<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('textbooks', function (Blueprint $table) {
            $table->foreignId('attendance_session_id')->nullable()->unique()->constrained('attendance_sessions')->nullOnDelete();
        });
        Schema::table('soutenances', function (Blueprint $table) {
            $table->json('evaluation_criteria')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('textbooks', fn (Blueprint $table) => $table->dropConstrainedForeignId('attendance_session_id'));
        Schema::table('soutenances', fn (Blueprint $table) => $table->dropColumn('evaluation_criteria'));
    }
};
