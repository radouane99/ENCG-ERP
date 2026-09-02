<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_surveillances', function (Blueprint $table) {
            if (! Schema::hasColumn('exam_surveillances', 'signature_data')) {
                $table->longText('signature_data')->nullable();
            }
            if (! Schema::hasColumn('exam_surveillances', 'signature_type')) {
                $table->string('signature_type')->default('digital')->nullable();
            }
            if (! Schema::hasColumn('exam_surveillances', 'signed_at')) {
                $table->timestamp('signed_at')->nullable();
            }
            if (! Schema::hasColumn('exam_surveillances', 'signature_hash')) {
                $table->string('signature_hash')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('exam_surveillances', function (Blueprint $table) {
            $table->dropColumn(['signature_data', 'signature_type', 'signed_at', 'signature_hash']);
        });
    }
};
