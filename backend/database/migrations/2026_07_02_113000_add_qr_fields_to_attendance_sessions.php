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
        Schema::table('attendance_sessions', function (Blueprint $table) {
            $table->string('module_name')->nullable();
            $table->string('group_name')->nullable();
            $table->string('room_name')->nullable();
            $table->string('qr_token')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('status')->default('active');
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('scanned_at')->nullable();
            $table->decimal('scanned_latitude', 10, 8)->nullable();
            $table->decimal('scanned_longitude', 11, 8)->nullable();
            $table->boolean('is_valid')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');

        Schema::table('attendance_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'module_name',
                'group_name',
                'room_name',
                'qr_token',
                'expires_at',
                'latitude',
                'longitude',
                'status',
            ]);
        });
    }
};
