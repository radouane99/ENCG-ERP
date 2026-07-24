<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE filieres DROP COLUMN IF EXISTS responsable_id CASCADE;');
        DB::statement('ALTER TABLE filieres ADD COLUMN responsable_id UUID NULL REFERENCES users(id) ON DELETE SET NULL;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE filieres DROP COLUMN IF EXISTS responsable_id CASCADE;');
    }
};
