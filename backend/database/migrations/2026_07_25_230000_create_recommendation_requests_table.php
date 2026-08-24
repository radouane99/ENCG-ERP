<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('recommendation_requests')) {
            Schema::create('recommendation_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
                $table->foreignId('professor_id')->nullable()->constrained('users')->onDelete('set null');
                $table->string('purpose')->default('Master / Mobilité');
                $table->string('status')->default('pending'); // pending, approved, rejected
                $table->string('ai_eligibility_score')->nullable();
                $table->text('ai_recommendation_text')->nullable();
                $table->string('delivery_method')->default('both'); // platform, email, both
                $table->timestamp('signed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('recommendation_requests');
    }
};
