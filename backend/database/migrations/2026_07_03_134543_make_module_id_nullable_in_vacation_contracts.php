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
        Schema::table('vacation_contracts', function (Blueprint $table) {
            $table->unsignedBigInteger('module_id')->nullable()->change();
            $table->string('session_type')->default('cours')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vacation_contracts', function (Blueprint $table) {
            $table->unsignedBigInteger('module_id')->nullable(false)->change();
            $table->string('session_type')->default(null)->change();
        });
    }
};
