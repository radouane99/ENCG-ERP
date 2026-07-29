<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'father_phone')) {
                $table->string('father_phone')->nullable();
            }
            if (!Schema::hasColumn('applications', 'mother_phone')) {
                $table->string('mother_phone')->nullable();
            }
            if (!Schema::hasColumn('applications', 'parent_phone')) {
                $table->string('parent_phone')->nullable();
            }
            if (!Schema::hasColumn('applications', 'emergency_contact_name')) {
                $table->string('emergency_contact_name')->nullable();
            }
            if (!Schema::hasColumn('applications', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone')->nullable();
            }
            if (!Schema::hasColumn('applications', 'allergy_type')) {
                $table->string('allergy_type')->nullable();
            }
            if (!Schema::hasColumn('applications', 'has_medical_followup')) {
                $table->boolean('has_medical_followup')->default(false);
            }
            if (!Schema::hasColumn('applications', 'medication_used')) {
                $table->string('medication_used')->nullable();
            }
            if (!Schema::hasColumn('applications', 'treating_doctor_info')) {
                $table->string('treating_doctor_info')->nullable();
            }
        });

        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'father_phone')) {
                $table->string('father_phone')->nullable();
            }
            if (!Schema::hasColumn('students', 'mother_phone')) {
                $table->string('mother_phone')->nullable();
            }
            if (!Schema::hasColumn('students', 'parent_phone')) {
                $table->string('parent_phone')->nullable();
            }
            if (!Schema::hasColumn('students', 'allergy_type')) {
                $table->string('allergy_type')->nullable();
            }
            if (!Schema::hasColumn('students', 'has_medical_followup')) {
                $table->boolean('has_medical_followup')->default(false);
            }
            if (!Schema::hasColumn('students', 'medication_used')) {
                $table->string('medication_used')->nullable();
            }
            if (!Schema::hasColumn('students', 'treating_doctor_info')) {
                $table->string('treating_doctor_info')->nullable();
            }
            if (!Schema::hasColumn('students', 'father_name_fr')) {
                $table->string('father_name_fr')->nullable();
            }
            if (!Schema::hasColumn('students', 'mother_name_fr')) {
                $table->string('mother_name_fr')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'father_phone', 'mother_phone', 'parent_phone',
                'emergency_contact_name', 'emergency_contact_phone',
                'allergy_type', 'has_medical_followup', 'medication_used', 'treating_doctor_info'
            ]);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'father_phone', 'mother_phone', 'parent_phone',
                'allergy_type', 'has_medical_followup', 'medication_used', 'treating_doctor_info',
                'father_name_fr', 'mother_name_fr'
            ]);
        });
    }
};
