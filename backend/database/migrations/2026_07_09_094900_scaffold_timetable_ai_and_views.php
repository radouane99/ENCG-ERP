<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Scaffold AI Timetable Tables
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_recurring')->default(false);
            $table->timestamps();
        });

        Schema::create('teacher_constraints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professor_id')->constrained()->cascadeOnDelete();
            $table->enum('day_of_week', ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('constraint_type', ['PREFER_NOT', 'UNAVAILABLE'])->default('UNAVAILABLE');
            $table->timestamps();
            
            // A teacher can't have duplicate constraints for the exact same time
            $table->unique(['professor_id', 'day_of_week', 'start_time', 'end_time'], 'unique_teacher_constraint');
        });

        Schema::create('room_equipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->string('equipment_type'); // e.g., 'PROJECTOR', 'COMPUTERS', 'SMARTBOARD'
            $table->integer('quantity')->default(1);
            $table->timestamps();
            
            $table->unique(['room_id', 'equipment_type']);
        });

        Schema::create('schedule_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->string('version_name'); // e.g., 'Draft v1', 'Published 2026'
            $table->enum('status', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])->default('DRAFT');
            $table->json('ai_metadata')->nullable(); // Store generation stats, fitness score, etc.
            $table->timestamps();
        });

        // 2. Add version_id to schedules
        Schema::table('schedules', function (Blueprint $table) {
            $table->foreignId('schedule_version_id')->nullable()->constrained('schedule_versions')->nullOnDelete();
        });

        // 3. Create SQL Views
        // Note: student_full_profile_view unifies users and students
        DB::statement("DROP VIEW IF EXISTS student_full_profile_view");
        DB::statement("
            CREATE VIEW student_full_profile_view AS
            SELECT 
                s.id as student_id,
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.cin,
                s.cne,
                u.address,
                u.city,
                u.birth_date,
                s.status,
                u.created_at,
                u.updated_at
            FROM students s
            JOIN users u ON s.user_id = u.id
        ");

        // Note: room_utilization_view tracks schedules per room
        DB::statement("DROP VIEW IF EXISTS room_utilization_view");
        DB::statement("
            CREATE VIEW room_utilization_view AS
            SELECT 
                r.id as room_id,
                r.name as room_name,
                r.capacity,
                r.type as room_type,
                COUNT(s.id) as scheduled_sessions,
                SUM(TIME_TO_SEC(TIMEDIFF(s.end_time, s.start_time))/3600) as total_hours_booked
            FROM rooms r
            LEFT JOIN schedules s ON r.id = s.room_id AND s.is_active = 1
            GROUP BY r.id, r.name, r.capacity, r.type
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS student_full_profile_view");
        DB::statement("DROP VIEW IF EXISTS room_utilization_view");

        Schema::table('schedules', function (Blueprint $table) {
            $table->dropForeign(['schedule_version_id']);
            $table->dropColumn('schedule_version_id');
        });

        Schema::dropIfExists('schedule_versions');
        Schema::dropIfExists('room_equipments');
        Schema::dropIfExists('teacher_constraints');
        Schema::dropIfExists('holidays');
    }
};
