<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('internships')) {
            Schema::create('internships', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained()->cascadeOnDelete();
                $table->string('type')->default('application');
                $table->string('company_name')->nullable();
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->string('status')->default('pending');
                $table->timestamps();
            });
        } else {
            Schema::table('internships', function (Blueprint $table) {
                if (!Schema::hasColumn('internships', 'student_id')) {
                    $table->foreignId('student_id')->nullable()->constrained()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('internships', 'status')) {
                    $table->string('status')->default('pending');
                }
            });
        }

        if (!Schema::hasTable('final_projects')) {
            Schema::create('final_projects', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained()->cascadeOnDelete();
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->string('status')->default('pending');
                $table->timestamps();
            });
        } else {
            Schema::table('final_projects', function (Blueprint $table) {
                if (!Schema::hasColumn('final_projects', 'student_id')) {
                    $table->foreignId('student_id')->nullable()->constrained()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('final_projects', 'status')) {
                    $table->string('status')->default('pending');
                }
            });
        }

        if (!Schema::hasTable('quizzes')) {
            Schema::create('quizzes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('module_id')->nullable()->constrained()->cascadeOnDelete();
                $table->string('title')->nullable();
                $table->integer('duration_minutes')->default(30);
                $table->string('status')->default('draft');
                $table->timestamps();
            });
        } else {
            Schema::table('quizzes', function (Blueprint $table) {
                if (!Schema::hasColumn('quizzes', 'module_id')) {
                    $table->foreignId('module_id')->nullable()->constrained()->cascadeOnDelete();
                }
                if (!Schema::hasColumn('quizzes', 'status')) {
                    $table->string('status')->default('draft');
                }
            });
        }
    }

    public function down(): void
    {
        // Graceful fallback to avoid data loss
    }
};
