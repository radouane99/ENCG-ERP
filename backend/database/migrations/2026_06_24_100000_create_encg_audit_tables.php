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
        // 1. Alumni Network
        Schema::create('alumni', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('graduation_year', 4);
            $table->string('current_company')->nullable();
            $table->string('current_position')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->boolean('is_open_to_mentoring')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Room Booking Conflicts
        Schema::create('room_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('room_name'); // Or foreign key to a generic 'rooms' table
            $table->foreignId('booked_by')->constrained('users');
            $table->string('purpose');
            $table->timestamp('start_time')->useCurrent();
            $table->timestamp('end_time')->useCurrent();
            $table->string('status')->default('pending'); // pending, approved, rejected, cancelled
            $table->timestamps();
        });

        // 3. Grade Appeals / Réclamations
        Schema::create('grade_appeals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('exam_id')->nullable()->constrained('exams')->nullOnDelete();
            $table->foreignId('grade_id')->nullable()->constrained('grades')->nullOnDelete();
            $table->text('reason');
            $table->string('status')->default('submitted'); // submitted, under_review, accepted, rejected
            $table->text('professor_comment')->nullable();
            $table->text('jury_decision')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Research Labs
        Schema::create('research_labs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained('institutions')->cascadeOnDelete();
            $table->string('name');
            $table->string('acronym')->nullable();
            $table->foreignId('director_id')->constrained('users');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('publications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_lab_id')->constrained('research_labs')->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('journal')->nullable();
            $table->date('publish_date')->nullable();
            $table->string('doi')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('publications');
        Schema::dropIfExists('research_labs');
        Schema::dropIfExists('grade_appeals');
        Schema::dropIfExists('room_bookings');
        Schema::dropIfExists('alumni');
    }
};
