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
        Schema::table('deliberation_reopen_requests', fn (Blueprint $table) => $table->string('seal_hash', 64)->nullable());
        Schema::table('deliberation_juries', function (Blueprint $table) {
            $table->foreignId('group_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('session', 20)->default('normale');
        });
    }
    public function down(): void { Schema::table('deliberation_juries', function (Blueprint $table) { $table->dropConstrainedForeignId('group_id'); $table->dropColumn('session'); }); Schema::table('deliberation_reopen_requests', fn (Blueprint $table) => $table->dropColumn('seal_hash')); Schema::dropIfExists('deliberation_meetings'); }
};
