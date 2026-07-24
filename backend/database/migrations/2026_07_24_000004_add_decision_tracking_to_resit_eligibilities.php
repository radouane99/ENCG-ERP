<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resit_eligibilities', function (Blueprint $table) {
            // #8 — Decision tracking: who decided + when
            if (!Schema::hasColumn('resit_eligibilities', 'decided_by')) {
                $table->unsignedBigInteger('decided_by')->nullable()->after('status');
                $table->foreign('decided_by')->references('id')->on('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('resit_eligibilities', 'decided_at')) {
                $table->timestamp('decided_at')->nullable()->after('decided_by');
            }

            // #6 — Justification document path (uploaded by student)
            if (!Schema::hasColumn('resit_eligibilities', 'justification_document')) {
                $table->string('justification_document')->nullable()->after('decided_at');
            }

            // #5 — Admin note / reason for refusal
            if (!Schema::hasColumn('resit_eligibilities', 'admin_note')) {
                $table->text('admin_note')->nullable()->after('justification_document');
            }
        });
    }

    public function down(): void
    {
        Schema::table('resit_eligibilities', function (Blueprint $table) {
            $table->dropForeign(['decided_by']);
            $table->dropColumn(['decided_by', 'decided_at', 'justification_document', 'admin_note']);
        });
    }
};
