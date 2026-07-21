<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL requires CASCADE — Schema::disableForeignKeyConstraints() is unreliable on pgsql
        DB::statement('DROP TABLE IF EXISTS "generated_documents" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "document_requests" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "document_templates" CASCADE');

        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('view_name'); // e.g., 'documents.attestation_scolarite'
            $table->decimal('fee_amount', 8, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('document_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_type_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending, processing, ready, rejected
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->json('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS "document_requests" CASCADE');
        DB::statement('DROP TABLE IF EXISTS "document_types" CASCADE');
    }
};
