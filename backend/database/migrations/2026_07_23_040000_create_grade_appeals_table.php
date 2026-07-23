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
        if (!Schema::hasTable('grade_appeals')) {
            Schema::create('grade_appeals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('assessment_id')->nullable()->constrained('assessments')->nullOnDelete();
                $table->foreignId('grade_id')->nullable()->constrained('grades')->nullOnDelete();
                $table->text('reason');
                $table->string('status')->default('pending'); // pending, under_review, approved, rejected
                $table->decimal('old_grade', 5, 2)->default(0.00);
                $table->decimal('new_grade', 5, 2)->nullable();
                $table->text('professor_notes')->nullable();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grade_appeals');
    }
};
