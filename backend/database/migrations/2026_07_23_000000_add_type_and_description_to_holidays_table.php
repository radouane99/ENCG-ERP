<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('holidays')) {
            Schema::table('holidays', function (Blueprint $table) {
                if (!Schema::hasColumn('holidays', 'type')) {
                    $table->string('type')->default('academic')->after('end_date');
                }
                if (!Schema::hasColumn('holidays', 'description')) {
                    $table->text('description')->nullable()->after('type');
                }
                if (!Schema::hasColumn('holidays', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('description');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('holidays')) {
            Schema::table('holidays', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('holidays', 'type')) {
                    $columns[] = 'type';
                }
                if (Schema::hasColumn('holidays', 'description')) {
                    $columns[] = 'description';
                }
                if (Schema::hasColumn('holidays', 'is_active')) {
                    $columns[] = 'is_active';
                }
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
