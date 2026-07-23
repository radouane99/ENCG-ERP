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
        if (!Schema::hasTable('exam_pv_signatures')) {
            Schema::create('exam_pv_signatures', function (Blueprint $table) {
                $table->id();
                $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
                $table->foreignId('room_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('signed_by_id')->nullable()->constrained('users')->nullOnDelete();
                $table->longText('signature_data')->nullable(); // Base64 Canvas data URI
                $table->integer('present_count')->default(0);
                $table->integer('absent_count')->default(0);
                $table->text('notes')->nullable();
                $table->timestamp('signed_at')->useCurrent();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_pv_signatures');
    }
};
