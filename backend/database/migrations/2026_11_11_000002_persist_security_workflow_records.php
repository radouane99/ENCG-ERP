<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_rectifications', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 100)->unique();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->foreignId('grade_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('grade_version')->nullable();
            $table->string('status')->default('pending_second_approver');
            $table->json('payload');
            $table->timestamp('approved_at')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->index(['institution_id', 'status']);
            $table->index(['grade_id', 'status']);
        });
        Schema::create('official_document_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('reference_code')->index();
            $table->string('signature_code', 100)->unique();
            $table->string('document_type');
            $table->string('status')->default('issued');
            $table->json('payload');
            $table->string('integrity_mac', 64);
            $table->text('revocation_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('official_document_signatures');
        Schema::dropIfExists('grade_rectifications');
    }
};
