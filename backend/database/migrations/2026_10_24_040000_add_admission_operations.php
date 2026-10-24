<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('admission_work_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->unique()->constrained('applications')->restrictOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('next_action', 500)->nullable();
            $table->date('due_on')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
        });
        Schema::create('admission_original_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('operation_id')->unique();
            $table->foreignId('application_id')->constrained('applications')->restrictOnDelete();
            $table->string('document_type', 40);
            $table->string('event', 20);
            $table->string('storage_location', 180)->nullable();
            $table->string('note', 500);
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['application_id', 'document_type', 'id']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('admission_original_events');
        Schema::dropIfExists('admission_work_items');
    }
};
