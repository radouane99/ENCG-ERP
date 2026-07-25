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
        if (!Schema::hasTable('evaluation_campaigns')) {
            Schema::create('evaluation_campaigns', function (Blueprint $table) {
                $table->id();
                $table->string('name')->default('Campagne d\'Évaluation S5-S6');
                $table->string('status')->default('OPEN'); // OPEN, CLOSED
                $table->integer('semester_number')->default(5);
                $table->unsignedBigInteger('academic_year_id')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('course_evaluations')) {
            Schema::create('course_evaluations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('campaign_id')->nullable();
                $table->foreignUuid('student_id')->nullable();
                $table->unsignedBigInteger('module_id')->nullable();
                $table->foreignUuid('professor_id')->nullable();
                $table->float('q1_organisation')->default(4.5);
                $table->float('q2_clarte')->default(4.5);
                $table->float('q3_dispo')->default(4.5);
                $table->float('q4_utilite')->default(4.5);
                $table->text('comment')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_evaluations');
        Schema::dropIfExists('evaluation_campaigns');
    }
};
