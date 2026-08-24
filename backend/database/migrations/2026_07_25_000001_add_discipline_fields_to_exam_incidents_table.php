<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_incidents', function (Blueprint $table) {
            if (! Schema::hasColumn('exam_incidents', 'confiscated_items')) {
                $table->string('confiscated_items')->nullable();
            }
            if (! Schema::hasColumn('exam_incidents', 'status')) {
                $table->string('status')->default('pending'); // pending, convoked, auditioned, resolved, dismissed
            }
            if (! Schema::hasColumn('exam_incidents', 'hearing_date')) {
                $table->string('hearing_date')->nullable();
            }
            if (! Schema::hasColumn('exam_incidents', 'hearing_room')) {
                $table->string('hearing_room')->nullable();
            }
            if (! Schema::hasColumn('exam_incidents', 'decision')) {
                $table->text('decision')->nullable();
            }
            if (! Schema::hasColumn('exam_incidents', 'sanction_scope')) {
                $table->string('sanction_scope')->nullable(); // module, semestre, blame, exclusion
            }
            if (! Schema::hasColumn('exam_incidents', 'hearing_notes')) {
                $table->text('hearing_notes')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('exam_incidents', function (Blueprint $table) {
            $table->dropColumn([
                'confiscated_items', 'status', 'hearing_date', 'hearing_room',
                'decision', 'sanction_scope', 'hearing_notes',
            ]);
        });
    }
};
