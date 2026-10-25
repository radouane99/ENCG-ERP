<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_desk_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_campaign_id')->constrained()->restrictOnDelete();
            $table->foreignId('application_id')->constrained()->restrictOnDelete();
            $table->date('service_day');
            $table->unsignedInteger('number');
            $table->string('desk', 80);
            $table->string('status', 20)->default('waiting');
            $table->foreignId('served_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('called_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->unique(['admission_campaign_id', 'service_day', 'number'], 'admission_desk_number_unique');
            $table->unique(['admission_campaign_id', 'service_day', 'application_id'], 'admission_desk_arrival_unique');
            $table->index(['application_id', 'status']);
            $table->index(['served_by', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_desk_tickets');
    }
};
