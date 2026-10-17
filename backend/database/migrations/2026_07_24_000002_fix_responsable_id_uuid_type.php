<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE filieres DROP COLUMN IF EXISTS responsable_id CASCADE;');
            DB::statement('ALTER TABLE filieres ADD COLUMN responsable_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL;');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE filieres DROP COLUMN IF EXISTS responsable_id CASCADE;');
        }
    }
};
