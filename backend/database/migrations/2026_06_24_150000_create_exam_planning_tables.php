<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── exam_seatings ──────────────────────────────────────────
        Schema::create('exam_seatings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->integer('seat_number');
            $table->boolean('is_present')->nullable();      // For actual attendance marking
            $table->text('notes')->nullable();              // e.g., "Cheating suspicion"
            $table->timestamps();

            $table->unique(['exam_id', 'student_id']);
        });

        // ── exam_surveillances ───────────────────────────────────
        Schema::create('exam_surveillances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('professor_id')->constrained('users')->cascadeOnDelete();
            $table->string('role')->default('surveillant'); // president_salle, surveillant
            $table->boolean('has_attended')->nullable();
            $table->timestamps();

            $table->unique(['exam_id', 'professor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_surveillances');
        Schema::dropIfExists('exam_seatings');
    }
};
