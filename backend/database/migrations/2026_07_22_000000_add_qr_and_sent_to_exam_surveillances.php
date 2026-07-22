<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_surveillances', function (Blueprint $table) {
            if (!Schema::hasColumn('exam_surveillances', 'qr_token')) {
                $table->string('qr_token')->unique()->nullable();
            }
            if (!Schema::hasColumn('exam_surveillances', 'sent_at')) {
                $table->timestamp('sent_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('exam_surveillances', function (Blueprint $table) {
            if (Schema::hasColumn('exam_surveillances', 'qr_token')) {
                $table->dropColumn('qr_token');
            }
            if (Schema::hasColumn('exam_surveillances', 'sent_at')) {
                $table->dropColumn('sent_at');
            }
        });
    }
};
