<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alumni_surveys', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->string('graduation_year');
            $table->string('employment_status'); // cdi, cdd, freelance, searching, entrepreneur
            $table->string('company_name')->nullable();
            $table->string('job_title')->nullable();
            $table->decimal('starting_salary', 10, 2)->nullable();
            $table->integer('months_to_hire')->nullable(); // Number of months it took to find a job
            $table->string('sector')->nullable(); // Finance, IT, Marketing, etc.
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alumni_surveys');
    }
};
