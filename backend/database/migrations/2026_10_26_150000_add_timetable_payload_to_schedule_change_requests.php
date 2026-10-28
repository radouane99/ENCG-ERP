<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedule_change_requests', function (Blueprint $table) {
            $table->foreignId('schedule_id')->nullable()->constrained('schedules')->nullOnDelete();
            $table->json('timetable_payload')->nullable();
            $table->text('review_note')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('schedule_change_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('schedule_id');
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['timetable_payload', 'review_note', 'reviewed_at']);
        });
    }
};
