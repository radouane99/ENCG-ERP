<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_export_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('data_export_requests', 'request_type')) {
                $table->string('request_type', 32)->default('access');
            }
            if (! Schema::hasColumn('data_export_requests', 'payload')) {
                $table->json('payload')->nullable();
            }
            if (! Schema::hasColumn('data_export_requests', 'notes')) {
                $table->text('notes')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('data_export_requests', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::hasColumn('data_export_requests', 'request_type') ? 'request_type' : null,
                Schema::hasColumn('data_export_requests', 'payload') ? 'payload' : null,
                Schema::hasColumn('data_export_requests', 'notes') ? 'notes' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
