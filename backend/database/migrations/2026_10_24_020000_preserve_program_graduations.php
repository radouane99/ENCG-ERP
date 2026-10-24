<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_graduations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->foreignId('student_id')->constrained()->restrictOnDelete();
            $table->foreignId('filiere_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->foreignId('deliberation_decision_id')->constrained()->restrictOnDelete();
            $table->foreignId('finalized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('filiere_name');
            $table->string('academic_year_label');
            $table->unsignedTinyInteger('terminal_semester');
            $table->timestamp('finalized_at');
            $table->timestamps();
            $table->unique(['student_id', 'filiere_id', 'academic_year_id'], 'student_program_graduation_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_graduations');
    }
};
