<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── institutions ─────────────────────────────────────────
        Schema::create('institutions', function (Blueprint $table) {
            $table->id();
            $table->string('name');                         // ENCG Fès
            $table->string('name_ar')->nullable();          // كلية العلوم
            $table->string('code')->unique();               // ENCG-FES
            $table->string('slug')->unique();
            $table->string('type')->default('grande_ecole'); // university, grande_ecole, faculty
            $table->string('logo_path')->nullable();
            $table->string('stamp_path')->nullable();
            $table->string('signature_path')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('fax')->nullable();
            $table->string('rector_name')->nullable();
            $table->string('director_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();           // Institution-specific config
            $table->timestamps();
            $table->softDeletes();
        });

        // ── campuses ─────────────────────────────────────────────
        Schema::create('campuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('address')->nullable();
            $table->boolean('is_main')->default(false);
            $table->timestamps();
        });

        // ── departments ──────────────────────────────────────────
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('name_ar')->nullable();
            $table->string('code')->unique();
            $table->string('head_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
        Schema::dropIfExists('campuses');
        Schema::dropIfExists('institutions');
    }
};
