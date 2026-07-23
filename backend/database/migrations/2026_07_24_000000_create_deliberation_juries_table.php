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
        if (!Schema::hasTable('deliberation_juries')) {
            Schema::create('deliberation_juries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('filiere_id')->constrained()->cascadeOnDelete();
                $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
                $table->tinyInteger('semester_number')->nullable(); // null for annual
                $table->string('type')->default('semestriel');     // semestriel, annuel
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // Professor or Chef
                $table->foreignId('module_id')->nullable()->constrained()->nullOnDelete(); // Associated module
                $table->string('user_name')->nullable();
                $table->string('role')->default('professeur');     // professeur, chef_filiere, president_jury
                $table->string('status')->default('pending');      // pending, signed
                $table->timestamp('signed_at')->nullable();
                $table->longText('signature_data')->nullable();    // Base64 PNG signature
                $table->string('digital_seal')->nullable();        // SHA-256 hash
                $table->string('ip_address')->nullable();
                $table->timestamps();

                $table->index(['filiere_id', 'academic_year_id', 'semester_number', 'type']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliberation_juries');
    }
};
