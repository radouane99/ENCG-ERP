<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('professor_document_requests')) {
            Schema::create('professor_document_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('professor_id')->nullable()->constrained('professors')->nullOnDelete();
                $table->string('document_type'); // attestation_travail, ordre_de_mission, attestation_salaire, autorisation_absence
                $table->string('tracking_code')->unique();
                $table->text('purpose');
                $table->string('destination')->nullable();
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->string('transport_mode')->nullable();
                $table->string('status')->default('pending'); // pending, ready, approved, rejected
                $table->text('admin_notes')->nullable();
                $table->string('signed_by')->nullable();
                $table->timestamp('signed_at')->nullable();
                $table->string('file_path')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('professor_document_requests');
    }
};
