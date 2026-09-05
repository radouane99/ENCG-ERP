<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('DROP TABLE IF EXISTS student_specialty_wishes CASCADE');
        DB::statement('DROP TABLE IF EXISTS filiere_quotas CASCADE');
        DB::statement('DROP SEQUENCE IF EXISTS filiere_quotas_id_seq CASCADE');
        DB::statement('DROP SEQUENCE IF EXISTS student_specialty_wishes_id_seq CASCADE');

        if (! Schema::hasTable('filiere_quotas')) {
            Schema::create('filiere_quotas', function (Blueprint $table) {
                $table->id();
                $table->foreignId('filiere_id')->constrained('filieres')->cascadeOnDelete();
                $table->string('academic_year')->default('2026/2027');
                $table->unsignedInteger('capacity')->default(60);
                $table->decimal('min_score_required', 5, 2)->default(10.0);
                $table->boolean('is_open')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('student_specialty_wishes')) {
            Schema::create('student_specialty_wishes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('filiere_id')->constrained('filieres')->cascadeOnDelete();
                $table->unsignedInteger('preference_rank'); // 1 à 5
                $table->string('academic_year')->default('2026/2027');
                $table->decimal('calculated_merit_score', 5, 2)->default(0.0);
                $table->string('allocation_status')->default('pending'); // pending, assigned, waiting_list, rejected
                $table->unsignedInteger('waiting_list_rank')->nullable();
                $table->timestamp('allocated_at')->nullable();
                $table->timestamps();

                $table->unique(['student_id', 'filiere_id', 'academic_year'], 'student_filiere_year_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_specialty_wishes');
        Schema::dropIfExists('filiere_quotas');
    }
};
