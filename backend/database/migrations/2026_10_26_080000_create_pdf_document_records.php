<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pdf_document_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('digital_identifier', 32)->nullable()->unique();
            $table->string('verification_token', 80)->unique();
            $table->string('content_fingerprint', 64)->unique();
            $table->string('source_view')->nullable();
            $table->string('document_label');
            $table->string('status', 24)->default('pending');
            $table->string('file_path')->nullable();
            $table->string('file_sha256', 64)->nullable();
            $table->unsignedBigInteger('file_bytes')->nullable();
            $table->unsignedInteger('page_count')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->foreignId('revoked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('revocation_reason')->nullable();
            $table->timestamps();
            $table->index(['institution_id', 'status', 'issued_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('pdf_document_records'); }
};
