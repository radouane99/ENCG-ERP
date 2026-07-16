<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * This migration was superseded by the richer `disciplinary_cases` table
 * created in 2024_01_01_000010_create_library_discipline_ai_tables.
 * `discipline_cases` is a redundant legacy table — drop it silently.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Drop the redundant legacy table in favour of `disciplinary_cases`
        Schema::dropIfExists('discipline_cases');
    }

    public function down(): void
    {
        // Re-create minimal stub for rollback safety
        Schema::create('discipline_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('type');
            $table->string('severity')->default('low');
            $table->string('status')->default('pending');
            $table->text('decision')->nullable();
            $table->date('incident_date');
            $table->timestamps();
        });
    }
};
