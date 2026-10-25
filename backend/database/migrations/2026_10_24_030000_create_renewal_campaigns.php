<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('renewal_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('draft');
            $table->date('opens_on');
            $table->date('closes_on');
            $table->string('public_message', 1000)->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->unique(['institution_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('renewal_campaigns');
    }
};
