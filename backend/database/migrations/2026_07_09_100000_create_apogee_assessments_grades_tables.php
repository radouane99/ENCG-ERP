<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL requires CASCADE — Schema::disableForeignKeyConstraints() is unreliable on pgsql
        DB::statement('DROP TABLE IF EXISTS "grade_appeals" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "grades" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "grade_components" CASCADE');

        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50);
            $table->decimal('weight', 5, 2); // percentage 0-100
            $table->date('date')->nullable();
            $table->timestamps();
        });

        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->decimal('value', 4, 2)->nullable(); // 0 to 20
            $table->boolean('absent')->default(false);
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            $table->unique(['student_id', 'assessment_id']);
        });
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS "grades" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "assessments" CASCADE');
    }
};
