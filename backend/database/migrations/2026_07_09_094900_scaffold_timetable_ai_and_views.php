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
            $table->string('type')->default('academic');
            $table->text('description')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('teacher_constraints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professor_id')->constrained()->cascadeOnDelete();
            $table->string('day_of_week'); // MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
            $table->time('start_time');
            $table->time('end_time');
            $table->string('constraint_type')->default('UNAVAILABLE'); // PREFER_NOT, UNAVAILABLE
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
            $table->string('status')->default('DRAFT'); // DRAFT, PUBLISHED, ARCHIVED
            $table->json('ai_metadata')->nullable(); // Store generation stats, fitness score, etc.
            $table->timestamps();
        });

        // 2. Add version_id to schedules
        Schema::table('schedules', function (Blueprint $table) {
            $table->foreignId('schedule_version_id')->nullable()->constrained('schedule_versions')->nullOnDelete();
        });

        // 3. Create SQL Views — PostgreSQL compatible syntax
        DB::statement('DROP VIEW IF EXISTS student_full_profile_view');
        DB::statement('
            CREATE VIEW student_full_profile_view AS
            SELECT
                s.id   AS student_id,
                u.id   AS user_id,
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
        ');

        // PostgreSQL compatible: use EXTRACT(EPOCH) instead of TIME_TO_SEC/TIMEDIFF,
        // and boolean literal (true) instead of integer (1).
        DB::statement('DROP VIEW IF EXISTS room_utilization_view');
        DB::statement('
            CREATE VIEW room_utilization_view AS
            SELECT
                r.id           AS room_id,
                r.name         AS room_name,
                r.capacity,
                r.type         AS room_type,
                COUNT(s.id)    AS scheduled_sessions,
                COALESCE(SUM(
                    EXTRACT(EPOCH FROM (s.end_time::time - s.start_time::time)) / 3600
                ), 0)          AS total_hours_booked
            FROM rooms r
            LEFT JOIN schedules s ON r.id = s.room_id AND s.is_active = true
            GROUP BY r.id, r.name, r.capacity, r.type
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS student_full_profile_view');
        DB::statement('DROP VIEW IF EXISTS room_utilization_view');

        Schema::table('schedules', function (Blueprint $table) {
            $table->dropForeign(['schedule_version_id']);
            $table->dropColumn('schedule_version_id');
        });

        DB::statement('DROP TABLE IF EXISTS "schedule_versions" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "room_equipments" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "teacher_constraints" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "holidays" CASCADE');
    }
};
