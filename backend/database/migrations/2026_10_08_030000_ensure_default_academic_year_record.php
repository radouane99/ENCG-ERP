<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ensure academic_years table always has anchor ID 1 (2025-2026) to prevent FK constraint violations
     * and guarantees active academic year is set.
     */
    public function up(): void
    {
        if (! Schema::hasTable('academic_years')) {
            return;
        }

        // 1. Ensure Institution #1 is valid for foreign key
        $institutionId = DB::table('institutions')->where('id', 1)->value('id')
            ?? DB::table('institutions')->value('id')
            ?? 1;

        // 2. Insert or preserve Anchor Academic Year #1
        $existsOne = DB::table('academic_years')->where('id', 1)->exists();
        if (! $existsOne) {
            DB::table('academic_years')->insert([
                'id' => 1,
                'institution_id' => $institutionId,
                'label' => '2025-2026',
                'start_year' => 2025,
                'end_year' => 2026,
                'start_date' => '2025-09-01',
                'end_date' => '2026-06-30',
                'is_current' => false,
                'is_locked' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Ensure official current academic year (ID 3) is set to is_current = true
        if (DB::table('academic_years')->where('id', 3)->exists()) {
            DB::table('academic_years')->where('id', '!=', 3)->update(['is_current' => false]);
            DB::table('academic_years')->where('id', 3)->update(['is_current' => true]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe no-op to preserve academic integrity
    }
};
