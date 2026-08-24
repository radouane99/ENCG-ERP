<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('user_name')->nullable();
                $table->string('user_email')->nullable();
                $table->string('user_role')->nullable();
                $table->string('action');
                $table->string('action_type')->default('DATA_MUTATION');
                $table->text('description')->nullable();
                $table->string('method', 10)->default('POST');
                $table->string('url')->nullable();
                $table->string('ip_address', 45)->default('127.0.0.1');
                $table->text('user_agent')->nullable();
                $table->json('payload')->nullable();
                $table->integer('response_status')->default(200);
                $table->string('severity', 20)->default('info');
                $table->string('sha256_hash', 64)->nullable();
                $table->string('cndp_reference')->default('D-W-2025/ENCG-FES');
                $table->timestamps();

                $table->index(['action_type', 'created_at']);
                $table->index(['user_id', 'created_at']);
                $table->index('ip_address');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
