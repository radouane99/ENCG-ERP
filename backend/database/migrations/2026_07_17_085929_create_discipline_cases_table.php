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
        Schema::create('discipline_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('reported_by')->nullable()->constrained('users')->onDelete('set null');
            $table->date('incident_date');
            $table->string('type');
            $table->text('description');
            $table->string('status')->default('pending');
            $table->string('severity')->default('medium');
            $table->string('decision')->nullable();
            $table->text('decision_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discipline_cases');
    }
};
