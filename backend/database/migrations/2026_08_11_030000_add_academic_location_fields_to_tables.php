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
        // 1. Table Applications
        Schema::table('applications', function (Blueprint $table) {
            if (! Schema::hasColumn('applications', 'high_school')) {
                $table->string('high_school')->nullable();
            }
            if (! Schema::hasColumn('applications', 'lycee')) {
                $table->string('lycee')->nullable();
            }
            if (! Schema::hasColumn('applications', 'academy')) {
                $table->string('academy')->nullable();
            }
            if (! Schema::hasColumn('applications', 'delegation')) {
                $table->string('delegation')->nullable();
            }
            if (! Schema::hasColumn('applications', 'province')) {
                $table->string('province')->nullable();
            }
            if (! Schema::hasColumn('applications', 'bac_year')) {
                $table->string('bac_year')->nullable();
            }
            if (! Schema::hasColumn('applications', 'bac_type')) {
                $table->string('bac_type')->nullable();
            }
            if (! Schema::hasColumn('applications', 'bac_serie')) {
                $table->string('bac_serie')->nullable();
            }
            if (! Schema::hasColumn('applications', 'blood_type')) {
                $table->string('blood_type')->nullable();
            }
        });

        // 2. Table Students
        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'high_school')) {
                $table->string('high_school')->nullable();
            }
            if (! Schema::hasColumn('students', 'lycee')) {
                $table->string('lycee')->nullable();
            }
            if (! Schema::hasColumn('students', 'academy')) {
                $table->string('academy')->nullable();
            }
            if (! Schema::hasColumn('students', 'delegation')) {
                $table->string('delegation')->nullable();
            }
            if (! Schema::hasColumn('students', 'province')) {
                $table->string('province')->nullable();
            }
            if (! Schema::hasColumn('students', 'bac_year')) {
                $table->string('bac_year')->nullable();
            }
            if (! Schema::hasColumn('students', 'bac_type')) {
                $table->string('bac_type')->nullable();
            }
            if (! Schema::hasColumn('students', 'bac_serie')) {
                $table->string('bac_serie')->nullable();
            }
            if (! Schema::hasColumn('students', 'blood_type')) {
                $table->string('blood_type')->nullable();
            }
            if (! Schema::hasColumn('students', 'father_last_name_fr')) {
                $table->string('father_last_name_fr')->nullable();
            }
            if (! Schema::hasColumn('students', 'father_first_name_fr')) {
                $table->string('father_first_name_fr')->nullable();
            }
            if (! Schema::hasColumn('students', 'father_last_name_ar')) {
                $table->string('father_last_name_ar')->nullable();
            }
            if (! Schema::hasColumn('students', 'father_first_name_ar')) {
                $table->string('father_first_name_ar')->nullable();
            }
            if (! Schema::hasColumn('students', 'mother_last_name_fr')) {
                $table->string('mother_last_name_fr')->nullable();
            }
            if (! Schema::hasColumn('students', 'mother_first_name_fr')) {
                $table->string('mother_first_name_fr')->nullable();
            }
            if (! Schema::hasColumn('students', 'mother_last_name_ar')) {
                $table->string('mother_last_name_ar')->nullable();
            }
            if (! Schema::hasColumn('students', 'mother_first_name_ar')) {
                $table->string('mother_first_name_ar')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
