<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('applications', 'high_school')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('high_school')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'lycee')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('lycee')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'academy')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('academy')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'delegation')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('delegation')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'province')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('province')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'bac_year')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('bac_year')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'bac_type')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('bac_type')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'bac_serie')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('bac_serie')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'blood_type')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('blood_type')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'filiere')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('filiere')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'father_name')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('father_name')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'mother_name')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('mother_name')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'father_cin')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('father_cin')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'mother_cin')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('mother_cin')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'father_profession')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('father_profession')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'mother_profession')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('mother_profession')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'first_name_ar')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('first_name_ar')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'last_name_ar')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('last_name_ar')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'birth_city')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('birth_city')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'birth_city_ar')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('birth_city_ar')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'address')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('address')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'address_ar')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('address_ar')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'city')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('city')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'region')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->string('region')->nullable();
            });
        }
        if (! Schema::hasColumn('applications', 'is_locked')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->boolean('is_locked')->default(false);
            });
        }
        if (! Schema::hasColumn('students', 'high_school')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('high_school')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'lycee')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('lycee')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'academy')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('academy')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'delegation')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('delegation')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'province')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('province')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'bac_year')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('bac_year')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'bac_type')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('bac_type')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'bac_serie')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('bac_serie')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'blood_type')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('blood_type')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'father_last_name_fr')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('father_last_name_fr')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'father_first_name_fr')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('father_first_name_fr')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'father_last_name_ar')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('father_last_name_ar')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'father_first_name_ar')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('father_first_name_ar')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'mother_last_name_fr')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('mother_last_name_fr')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'mother_first_name_fr')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('mother_first_name_fr')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'mother_last_name_ar')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('mother_last_name_ar')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'mother_first_name_ar')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('mother_first_name_ar')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'father_name')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('father_name')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'mother_name')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('mother_name')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'father_cin')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('father_cin')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'mother_cin')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('mother_cin')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'father_profession')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('father_profession')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'mother_profession')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('mother_profession')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'address_ar')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('address_ar')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'birth_city_ar')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('birth_city_ar')->nullable();
            });
        }
        if (! Schema::hasColumn('students', 'is_locked')) {
            Schema::table('students', function (Blueprint $table) {
                $table->boolean('is_locked')->default(false);
            });
        }
    }

    public function down(): void
    {
        // Additive dossier fields: retain data on rollback.
    }
};
