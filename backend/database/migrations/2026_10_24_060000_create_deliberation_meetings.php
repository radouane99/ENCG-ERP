<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('deliberation_meetings', function (Blueprint $table) {
            $table->id(); $table->foreignId('deliberation_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('room_id')->constrained()->restrictOnDelete();
            $table->timestamp('starts_at'); $table->timestamp('ends_at');
            $table->unsignedInteger('version')->default(1); $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('deliberation_meetings'); }
};
