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
        Schema::create('module_pv_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('academic_year_id')->default(1);
            $table->foreignId('signed_by')->constrained('users')->cascadeOnDelete();
            $table->longText('signature_data'); // Base64 signature image
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('signed_at')->useCurrent();
            $table->timestamps();

            // A group's module PV can only be signed once per academic year
            $table->unique(['module_id', 'group_id', 'academic_year_id'], 'module_group_year_signature_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_pv_signatures');
    }
};
