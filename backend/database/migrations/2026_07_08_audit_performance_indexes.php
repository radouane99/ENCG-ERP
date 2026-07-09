<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * [AUDIT DB-01] Add missing indexes on hot-path columns.
 * These columns are used in WHERE clauses and JOIN conditions
 * but lacked indexes, causing full-table scans.
 */
return new class extends Migration
{
    public function up(): void
    {
        // students table: cne and student_number are used for lookups and search
        Schema::table('students', function (Blueprint $table) {
            $indexes = collect(Schema::getIndexes('students'))->pluck('name');

            if (!$indexes->contains('students_cne_index')) {
                $table->index('cne', 'students_cne_index');
            }
            if (!$indexes->contains('students_student_number_index')) {
                $table->index('student_number', 'students_student_number_index');
            }
            if (!$indexes->contains('students_status_index')) {
                $table->index('status', 'students_status_index');
            }
            if (!$indexes->contains('students_institution_id_status_index')) {
                $table->index(['institution_id', 'status'], 'students_institution_id_status_index');
            }
        });

        // professors table: institution_id + contract_type is a common filter pair
        Schema::table('professors', function (Blueprint $table) {
            $indexes = collect(Schema::getIndexes('professors'))->pluck('name');

            if (!$indexes->contains('professors_institution_id_contract_type_index')) {
                $table->index(['institution_id', 'contract_type'], 'professors_institution_id_contract_type_index');
            }
        });

        // internships table: student_id + status is a common filter pair
        if (Schema::hasTable('internships')) {
            Schema::table('internships', function (Blueprint $table) {
                $indexes = collect(Schema::getIndexes('internships'))->pluck('name');

                if (!$indexes->contains('internships_student_id_status_index')) {
                    $table->index(['student_id', 'status'], 'internships_student_id_status_index');
                }
            });
        }

        // vacation_contracts: professor_id + status for HR queries
        if (Schema::hasTable('vacation_contracts')) {
            Schema::table('vacation_contracts', function (Blueprint $table) {
                $indexes = collect(Schema::getIndexes('vacation_contracts'))->pluck('name');

                if (!$indexes->contains('vacation_contracts_professor_id_status_index')) {
                    $table->index(['professor_id', 'status'], 'vacation_contracts_professor_id_status_index');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropIndex('students_cne_index');
                $table->dropIndex('students_student_number_index');
                $table->dropIndex('students_status_index');
                $table->dropIndex('students_institution_id_status_index');
            }
        });

        Schema::table('professors', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropIndex('professors_institution_id_contract_type_index');
            }
        });
    }
};
