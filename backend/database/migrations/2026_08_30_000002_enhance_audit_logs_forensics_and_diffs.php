<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('audit_logs', 'auditable_type')) {
                $table->string('auditable_type')->nullable()->after('user_role');
            }
            if (! Schema::hasColumn('audit_logs', 'auditable_id')) {
                $table->unsignedBigInteger('auditable_id')->nullable()->after('auditable_type');
            }
            if (! Schema::hasColumn('audit_logs', 'old_values')) {
                $table->json('old_values')->nullable()->after('payload');
            }
            if (! Schema::hasColumn('audit_logs', 'new_values')) {
                $table->json('new_values')->nullable()->after('old_values');
            }
            if (! Schema::hasColumn('audit_logs', 'event')) {
                $table->string('event', 50)->default('mutation')->after('action_type');
            }
            if (! Schema::hasColumn('audit_logs', 'execution_time_ms')) {
                $table->integer('execution_time_ms')->nullable()->after('response_status');
            }
            if (! Schema::hasColumn('audit_logs', 'institution_id')) {
                $table->foreignId('institution_id')->nullable()->constrained('institutions')->nullOnDelete()->after('user_id');
            }
        });

        // Add indices safely
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['auditable_type', 'auditable_id'], 'idx_audit_logs_auditable');
            $table->index(['event', 'created_at'], 'idx_audit_logs_event_created');
            $table->index(['severity', 'created_at'], 'idx_audit_logs_severity_created');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $columns = [
                'auditable_type',
                'auditable_id',
                'old_values',
                'new_values',
                'event',
                'execution_time_ms',
                'institution_id',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('audit_logs', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
