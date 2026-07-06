<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('internship_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->constrained('internships')->cascadeOnDelete();
            $table->enum('document_type', ['convention', 'rapport_etape', 'rapport_final', 'attestation', 'fiche_evaluation']);
            $table->string('file_path');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('feedback')->nullable();
            $table->timestamps();
        });

        Schema::create('soutenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->unique()->constrained('internships')->cascadeOnDelete();
            $table->dateTime('date_time');
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->foreignId('president_id')->constrained('professors');
            $table->foreignId('examiner_id')->constrained('professors');
            $table->decimal('grade', 5, 2)->nullable();
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('soutenances');
        Schema::dropIfExists('internship_documents');
    }
};
