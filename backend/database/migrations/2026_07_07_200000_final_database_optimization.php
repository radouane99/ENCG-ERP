<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. STANDARDIZATION

        // A. Fix attendance_records student_id reference
        // SQLite doesn't support dropping/adding Foreign Keys easily on existing tables.
        // We only run this on MySQL/PostgreSQL.
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('attendance_records', function (Blueprint $table) {
                $table->dropForeign(['student_id']);
                $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            });
        }

        // B. Convert all 'status' columns to VARCHAR(20)
        $tablesWithStatus = [
            'absence_justifications', 'academic_projects', 'admission_campaigns',
            'applications', 'attendance_records', 'attendance_sessions',
            'attendances', 'borrowings', 'club_events', 'convocations',
            'data_export_requests', 'deliberations', 'disciplinary_cases',
            'document_requests', 'grade_appeals', 'internship_documents',
            'internship_reports', 'professor_availabilities', 'project_defenses',
            'room_bookings', 'soutenances', 'student_cards',
            'student_module_reservations', 'student_registrations', 'students',
            'tickets', 'vacation_contracts', 'vacation_payments', 'vacation_sessions'
        ];

        foreach ($tablesWithStatus as $tableName) {
            if (Schema::hasColumn($tableName, 'status')) {
                // MODIFY is MySQL specific, we ignore it in SQLite (Testing)
                if (DB::getDriverName() !== 'sqlite') {
                    DB::statement("ALTER TABLE `{$tableName}` MODIFY `status` VARCHAR(20) DEFAULT 'pending'");
                }
            }
        }

        // 2. FINAL PURGE

        // A. ai_chat_messages -> Merge into messages / conversations
        if (Schema::hasTable('ai_chat_messages')) {
            Schema::dropIfExists('ai_chat_messages');
        }

        // B. alumni_surveys -> Migrate data to academic_projects
        if (Schema::hasTable('alumni_surveys') && Schema::hasTable('academic_projects')) {
            // We only run this data migration in MySQL because SQLite doesn't support CONCAT() natively in older versions
            if (DB::getDriverName() !== 'sqlite') {
                DB::statement("
                    INSERT INTO academic_projects (student_id, type, title, company_name, position_title, status, description, created_at, updated_at)
                    SELECT 
                        student_id, 
                        'alumni_survey', 
                        job_title, 
                        company_name, 
                        job_title, 
                        employment_status, 
                        CONCAT('Graduation: ', graduation_year, ' | Sector: ', sector, ' | Salary: ', starting_salary),
                        created_at, 
                        updated_at
                    FROM alumni_surveys
                ");
            }
            Schema::dropIfExists('alumni_surveys');
        }

        // C. telescope_* tables
        Schema::dropIfExists('telescope_entries_tags');
        Schema::dropIfExists('telescope_entries');
        Schema::dropIfExists('telescope_monitoring');

        // 3. INDEX OPTIMIZATION
        
        Schema::table('document_requests', function (Blueprint $table) {
            $indexes = Schema::getIndexes('document_requests');
            $hasIndex = false;
            foreach ($indexes as $index) {
                if ($index['name'] === 'document_requests_student_id_status_index') {
                    $hasIndex = true;
                    break;
                }
            }
            if (!$hasIndex) {
                // We explicitly name the index so we can drop it easily later
                $table->index(['student_id', 'status'], 'document_requests_student_id_status_index');
            }
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            $indexes = Schema::getIndexes('attendance_records');
            $hasIndex = false;
            foreach ($indexes as $index) {
                if ($index['name'] === 'attendance_records_attendance_session_id_status_index') {
                    $hasIndex = true;
                    break;
                }
            }
            if (!$hasIndex) {
                $table->index(['attendance_session_id', 'status'], 'attendance_records_attendance_session_id_status_index');
            }
        });
    }

    public function down(): void
    {
        // Revert index optimization
        Schema::table('document_requests', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropIndex('document_requests_student_id_status_index');
            }
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropIndex('attendance_records_attendance_session_id_status_index');
            }
        });
    }
};