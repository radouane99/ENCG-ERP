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

        // A. Fix attendance_records student_id foreign key
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('attendance_records', function (Blueprint $table) {
                $table->dropForeign(['student_id']);
                $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            });
        }

        // B. Convert all 'status' columns to VARCHAR — PostgreSQL compatible syntax
        $tablesWithStatus = [
            'absence_justifications', 'academic_projects', 'admission_campaigns',
            'applications', 'attendance_records', 'attendance_sessions',
            'attendances', 'borrowings', 'club_events', 'convocations',
            'data_export_requests', 'deliberations', 'disciplinary_cases',
            'document_requests', 'internship_documents',
            'internship_reports', 'professor_availabilities', 'project_defenses',
            'room_bookings', 'student_cards',
            'student_module_reservations', 'student_registrations', 'students',
            'tickets', 'vacation_contracts', 'vacation_payments', 'vacation_sessions',
        ];

        $driver = DB::getDriverName();

        foreach ($tablesWithStatus as $tableName) {
            if (!Schema::hasTable($tableName)) continue;
            if (!Schema::hasColumn($tableName, 'status')) continue;

            if ($driver === 'mysql') {
                DB::statement("ALTER TABLE `{$tableName}` MODIFY `status` VARCHAR(20) DEFAULT 'pending'");
            } elseif ($driver === 'pgsql') {
                // PostgreSQL: ALTER COLUMN TYPE — safe for varchar-to-varchar changes
                DB::statement("ALTER TABLE \"{$tableName}\" ALTER COLUMN \"status\" TYPE VARCHAR(20)");
            }
            // sqlite: skip — no ALTER COLUMN TYPE support
        }

        // 2. FINAL PURGE

        // A. ai_chat_messages
        // DB::statement('DROP TABLE IF EXISTS "ai_chat_messages" CASCADE');

        // B. alumni_surveys — migrate to academic_projects then drop
        if (Schema::hasTable('alumni_surveys') && Schema::hasTable('academic_projects')) {
            if ($driver !== 'sqlite') {
                $separator = $driver === 'pgsql' ? ' || ' : ', ';
                if ($driver === 'pgsql') {
                    DB::statement("
                        INSERT INTO academic_projects (student_id, type, title, company_name, position_title, status, description, created_at, updated_at)
                        SELECT
                            student_id,
                            'alumni_survey',
                            job_title,
                            company_name,
                            job_title,
                            employment_status,
                            'Graduation: ' || graduation_year::text || ' | Sector: ' || sector || ' | Salary: ' || starting_salary::text,
                            created_at,
                            updated_at
                        FROM alumni_surveys
                    ");
                } else {
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
            }
            DB::statement('DROP TABLE IF EXISTS "alumni_surveys" CASCADE');
        }

        // C. telescope_* tables
        DB::statement('DROP TABLE IF EXISTS "telescope_entries_tags" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "telescope_entries" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "telescope_monitoring" CASCADE');

        // 3. INDEX OPTIMIZATION

        if (Schema::hasTable('document_requests')) {
            Schema::table('document_requests', function (Blueprint $table) {
                $indexes = Schema::getIndexes('document_requests');
                $hasIndex = collect($indexes)->contains(fn($i) => $i['name'] === 'document_requests_student_id_status_index');
                if (!$hasIndex) {
                    $table->index(['student_id', 'status'], 'document_requests_student_id_status_index');
                }
            });
        }

        if (Schema::hasTable('attendance_records')) {
            Schema::table('attendance_records', function (Blueprint $table) {
                $indexes = Schema::getIndexes('attendance_records');
                $hasIndex = collect($indexes)->contains(fn($i) => $i['name'] === 'attendance_records_attendance_session_id_status_index');
                if (!$hasIndex) {
                    $table->index(['attendance_session_id', 'status'], 'attendance_records_attendance_session_id_status_index');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('document_requests')) {
            Schema::table('document_requests', function (Blueprint $table) {
                $table->dropIndexIfExists('document_requests_student_id_status_index');
            });
        }

        if (Schema::hasTable('attendance_records')) {
            Schema::table('attendance_records', function (Blueprint $table) {
                $table->dropIndexIfExists('attendance_records_attendance_session_id_status_index');
            });
        }
    }
};