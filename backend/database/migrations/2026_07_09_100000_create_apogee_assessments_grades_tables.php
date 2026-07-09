<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('grade_appeals');
        Schema::dropIfExists('grades');
        Schema::dropIfExists('grade_components');
        Schema::enableForeignKeyConstraints();

        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['CC', 'Exam', 'TP', 'Project']);
            $table->decimal('weight', 5, 2); // percentage 0-100
            $table->date('date')->nullable();
            $table->timestamps();
            
            // Cannot have two exams for the same module normally, but let's keep it simple.
        });

        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->decimal('value', 4, 2)->nullable(); // 0 to 20
            $table->boolean('absent')->default(false);
            $table->timestamps();

            $table->unique(['student_id', 'assessment_id']);
        });
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('grades');
        Schema::dropIfExists('assessments');
        Schema::enableForeignKeyConstraints();
    }
};
