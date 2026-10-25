<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('exam_seatings', 'status')) {
            Schema::table('exam_seatings', fn (Blueprint $table) => $table->string('status', 20)->nullable()->index());
            DB::table('exam_seatings')->where('is_present', true)->update(['status' => 'present']);
            DB::table('exam_seatings')->where('is_present', false)->update(['status' => 'absent']);
            DB::table('exam_seatings')->whereNull('is_present')->whereNotNull('sent_at')->update(['status' => 'sent']);
        }
    }

    public function down(): void
    {
        Schema::table('exam_seatings', fn (Blueprint $table) => $table->dropColumn('status'));
    }
};
