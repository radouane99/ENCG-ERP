<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('academic_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('type')->index(); // 'internship', 'pfe'
            $table->string('title')->nullable();
            $table->string('title_ar')->nullable();
            $table->text('description')->nullable();
            $table->string('company_name')->nullable();
            $table->string('company_address')->nullable();
            $table->string('company_city')->nullable();
            $table->string('supervisor_name')->nullable();
            $table->string('supervisor_email')->nullable();
            $table->string('supervisor_phone')->nullable();
            $table->string('position_title')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status')->default('pending');
            $table->foreignId('professor_supervisor_id')->nullable()->constrained('professors')->nullOnDelete();
            $table->timestamps();
        });

        // Migrate internships
        if (Schema::hasTable('internships')) {
            $internships = DB::table('internships')->get();
            foreach ($internships as $internship) {
                DB::table('academic_projects')->insert([
                    'institution_id' => $internship->institution_id ?? null,
                    'academic_year_id' => $internship->academic_year_id ?? null,
                    'student_id' => $internship->student_id,
                    'type' => 'internship',
                    'title' => 'Internship at ' . ($internship->company_name ?? 'Unknown'),
                    'company_name' => $internship->company_name ?? null,
                    'company_address' => $internship->company_address ?? null,
                    'company_city' => $internship->company_city ?? null,
                    'supervisor_name' => $internship->supervisor_name ?? null,
                    'supervisor_email' => $internship->supervisor_email ?? null,
                    'supervisor_phone' => $internship->supervisor_phone ?? null,
                    'position_title' => $internship->position_title ?? null,
                    'start_date' => $internship->start_date ?? null,
                    'end_date' => $internship->end_date ?? null,
                    'status' => $internship->status ?? 'pending',
                    'professor_supervisor_id' => $internship->professor_supervisor_id ?? null,
                    'created_at' => property_exists($internship, 'created_at') ? $internship->created_at : now(),
                    'updated_at' => property_exists($internship, 'updated_at') ? $internship->updated_at : now(),
                ]);
            }
        }

        // Migrate final_projects
        if (Schema::hasTable('final_projects')) {
            $finalProjects = DB::table('final_projects')->get();
            foreach ($finalProjects as $fp) {
                DB::table('academic_projects')->insert([
                    'institution_id' => $fp->institution_id ?? null,
                    'academic_year_id' => $fp->academic_year_id ?? null,
                    'student_id' => $fp->student_id,
                    'type' => 'pfe',
                    'title' => $fp->title ?? null,
                    'title_ar' => $fp->title_ar ?? null,
                    'description' => $fp->description ?? null,
                    'company_name' => $fp->company_name ?? null,
                    'company_city' => $fp->company_city ?? null,
                    'status' => $fp->status ?? 'pending',
                    'created_at' => property_exists($fp, 'created_at') ? $fp->created_at : now(),
                    'updated_at' => property_exists($fp, 'updated_at') ? $fp->updated_at : now(),
                ]);
            }
        }

        Schema::dropIfExists('internships');
        Schema::dropIfExists('final_projects');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_projects');
    }
};
