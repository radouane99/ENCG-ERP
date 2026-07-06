<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('convocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('rooms');
            $table->integer('seat_number')->nullable();
            $table->string('reference')->unique(); // UUID or unique code
            $table->enum('status', ['draft', 'sent', 'viewed', 'printed'])->default('draft');
            $table->timestamps();

            // Prevent a student from having multiple convocations for the same exam
            $table->unique(['exam_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('convocations');
    }
};
