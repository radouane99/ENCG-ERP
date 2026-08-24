<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('discipline_cases');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Table is an empty duplicate of disciplinary_cases
    }
};
