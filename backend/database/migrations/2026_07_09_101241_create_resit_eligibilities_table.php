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
        Schema::create('resit_eligibilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_session_id')->constrained()->cascadeOnDelete(); // The NORMALE session that triggered this
            $table->boolean('is_eligible')->default(true);
            $table->timestamps();

            // A student can only have one resit eligibility record per module per session
            $table->unique(['student_id', 'module_id', 'exam_session_id'], 'resit_eligibility_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resit_eligibilities');
    }
};
