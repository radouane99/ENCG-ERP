<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }
        $foreignKeys = DB::select("SELECT conname FROM pg_constraint WHERE conrelid='grades'::regclass AND contype='f' AND confrelid='assessments'::regclass");
        foreach ($foreignKeys as $key) {
            DB::statement('ALTER TABLE grades DROP CONSTRAINT "'.str_replace('"', '""', $key->conname).'"');
        }
        DB::statement('ALTER TABLE grades ADD CONSTRAINT grades_assessment_preserve_fk FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE RESTRICT');
    }

    public function down(): void {}
};
