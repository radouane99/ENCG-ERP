<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ensure student_documents table exists
        if (!Schema::hasTable('student_documents')) {
            Schema::create('student_documents', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('student_id')->nullable();
                $table->unsignedBigInteger('application_id')->nullable();
                $table->string('cne')->nullable()->index();
                $table->string('type')->index(); // bac, cnie, photo, releve_notes, etc.
                $table->string('file_path');
                $table->string('original_filename')->nullable();
                $table->string('mime_type')->nullable();
                $table->unsignedInteger('file_size')->nullable();
                $table->string('status')->default('pending');
                $table->timestamps();
            });
        }

        // 2. Ensure all parent and medical fields exist on applications table
        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'first_name_ar')) $table->string('first_name_ar')->nullable();
            if (!Schema::hasColumn('applications', 'last_name_ar')) $table->string('last_name_ar')->nullable();
            if (!Schema::hasColumn('applications', 'gender')) $table->string('gender')->nullable();

            if (!Schema::hasColumn('applications', 'birth_date')) $table->string('birth_date')->nullable();
            if (!Schema::hasColumn('applications', 'birth_city')) $table->string('birth_city')->nullable();
            if (!Schema::hasColumn('applications', 'birth_city_ar')) $table->string('birth_city_ar')->nullable();
            if (!Schema::hasColumn('applications', 'birth_country')) $table->string('birth_country')->nullable();
            if (!Schema::hasColumn('applications', 'nationality')) $table->string('nationality')->nullable();
            if (!Schema::hasColumn('applications', 'address')) $table->string('address')->nullable();
            if (!Schema::hasColumn('applications', 'city')) $table->string('city')->nullable();
            if (!Schema::hasColumn('applications', 'region')) $table->string('region')->nullable();
            if (!Schema::hasColumn('applications', 'family_status')) $table->string('family_status')->nullable();

            if (!Schema::hasColumn('applications', 'father_name')) $table->string('father_name')->nullable();
            if (!Schema::hasColumn('applications', 'father_name_ar')) $table->string('father_name_ar')->nullable();
            if (!Schema::hasColumn('applications', 'father_cin')) $table->string('father_cin')->nullable();
            if (!Schema::hasColumn('applications', 'father_profession')) $table->string('father_profession')->nullable();
            if (!Schema::hasColumn('applications', 'father_phone')) $table->string('father_phone')->nullable();

            if (!Schema::hasColumn('applications', 'mother_name')) $table->string('mother_name')->nullable();
            if (!Schema::hasColumn('applications', 'mother_name_ar')) $table->string('mother_name_ar')->nullable();
            if (!Schema::hasColumn('applications', 'mother_cin')) $table->string('mother_cin')->nullable();
            if (!Schema::hasColumn('applications', 'mother_profession')) $table->string('mother_profession')->nullable();
            if (!Schema::hasColumn('applications', 'mother_phone')) $table->string('mother_phone')->nullable();

            if (!Schema::hasColumn('applications', 'parent_phone')) $table->string('parent_phone')->nullable();
            if (!Schema::hasColumn('applications', 'emergency_contact_name')) $table->string('emergency_contact_name')->nullable();
            if (!Schema::hasColumn('applications', 'emergency_contact_phone')) $table->string('emergency_contact_phone')->nullable();

            if (!Schema::hasColumn('applications', 'allergy_type')) $table->string('allergy_type')->nullable();
            if (!Schema::hasColumn('applications', 'has_medical_followup')) $table->boolean('has_medical_followup')->default(false);
            if (!Schema::hasColumn('applications', 'medication_used')) $table->string('medication_used')->nullable();
            if (!Schema::hasColumn('applications', 'treating_doctor_info')) $table->string('treating_doctor_info')->nullable();
            if (!Schema::hasColumn('applications', 'has_disability')) $table->boolean('has_disability')->default(false);
            if (!Schema::hasColumn('applications', 'disability_details')) $table->string('disability_details')->nullable();
            if (!Schema::hasColumn('applications', 'photo_path')) $table->string('photo_path')->nullable();
        });

        // 3. Ensure all parent and medical fields exist on students table
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'cin')) $table->string('cin')->nullable();
            if (!Schema::hasColumn('students', 'first_name_ar')) $table->string('first_name_ar')->nullable();
            if (!Schema::hasColumn('students', 'last_name_ar')) $table->string('last_name_ar')->nullable();
            if (!Schema::hasColumn('students', 'gender')) $table->string('gender')->nullable();


            if (!Schema::hasColumn('students', 'birth_date')) $table->string('birth_date')->nullable();
            if (!Schema::hasColumn('students', 'birth_city')) $table->string('birth_city')->nullable();
            if (!Schema::hasColumn('students', 'birth_city_ar')) $table->string('birth_city_ar')->nullable();
            if (!Schema::hasColumn('students', 'birth_country')) $table->string('birth_country')->nullable();
            if (!Schema::hasColumn('students', 'nationality')) $table->string('nationality')->nullable();
            if (!Schema::hasColumn('students', 'address')) $table->string('address')->nullable();
            if (!Schema::hasColumn('students', 'city')) $table->string('city')->nullable();
            if (!Schema::hasColumn('students', 'region')) $table->string('region')->nullable();
            if (!Schema::hasColumn('students', 'family_status')) $table->string('family_status')->nullable();

            if (!Schema::hasColumn('students', 'father_name')) $table->string('father_name')->nullable();
            if (!Schema::hasColumn('students', 'father_name_ar')) $table->string('father_name_ar')->nullable();
            if (!Schema::hasColumn('students', 'father_cin')) $table->string('father_cin')->nullable();
            if (!Schema::hasColumn('students', 'father_profession')) $table->string('father_profession')->nullable();
            if (!Schema::hasColumn('students', 'father_phone')) $table->string('father_phone')->nullable();

            if (!Schema::hasColumn('students', 'mother_name')) $table->string('mother_name')->nullable();
            if (!Schema::hasColumn('students', 'mother_name_ar')) $table->string('mother_name_ar')->nullable();
            if (!Schema::hasColumn('students', 'mother_cin')) $table->string('mother_cin')->nullable();
            if (!Schema::hasColumn('students', 'mother_profession')) $table->string('mother_profession')->nullable();
            if (!Schema::hasColumn('students', 'mother_phone')) $table->string('mother_phone')->nullable();

            if (!Schema::hasColumn('students', 'parent_phone')) $table->string('parent_phone')->nullable();
            if (!Schema::hasColumn('students', 'emergency_contact_name')) $table->string('emergency_contact_name')->nullable();
            if (!Schema::hasColumn('students', 'emergency_contact_phone')) $table->string('emergency_contact_phone')->nullable();

            if (!Schema::hasColumn('students', 'allergy_type')) $table->string('allergy_type')->nullable();
            if (!Schema::hasColumn('students', 'has_medical_followup')) $table->boolean('has_medical_followup')->default(false);
            if (!Schema::hasColumn('students', 'medication_used')) $table->string('medication_used')->nullable();
            if (!Schema::hasColumn('students', 'treating_doctor_info')) $table->string('treating_doctor_info')->nullable();
            if (!Schema::hasColumn('students', 'has_disability')) $table->boolean('has_disability')->default(false);
            if (!Schema::hasColumn('students', 'disability_details')) $table->string('disability_details')->nullable();
            if (!Schema::hasColumn('students', 'photo_path')) $table->string('photo_path')->nullable();
        });
    }

    public function down(): void
    {
    }
};
