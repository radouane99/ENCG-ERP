<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('contact_submissions')) {
            Schema::create('contact_submissions', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email');
                $table->string('subject')->nullable();
                $table->text('message');
                $table->timestamps();
            });
        }
        Schema::table('contact_submissions', function (Blueprint $table) {
            $table->foreignId('institution_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('department', 30)->default('general')->index();
            $table->string('status', 20)->default('new')->index();
        });
    }

    public function down(): void
    {
        Schema::table('contact_submissions', function (Blueprint $table) {
            $table->dropForeign(['institution_id']);
            $table->dropColumn(['institution_id', 'department', 'status']);
        });
    }
};
