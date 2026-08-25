<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('edt_campaigns') === false) {
            Schema::create('edt_campaigns', function (Blueprint $table) {
                $table->id();
                $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
                $table->string('campaign', 16); // AUTUMN | SPRING
                $table->string('status', 16)->default('CLOSED'); // OPEN | CLOSED
                $table->boolean('allow_saturday')->default(false);
                $table->timestamp('opened_at')->nullable();
                $table->timestamp('closed_at')->nullable();
                $table->foreignId('opened_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->unique(['academic_year_id', 'campaign']);
            });
        }

        if (Schema::hasTable('schedule_versions')) {
            Schema::table('schedule_versions', function (Blueprint $table) {
                if (! Schema::hasColumn('schedule_versions', 'filiere_id')) {
                    $table->foreignId('filiere_id')->nullable()->after('semester_id')->constrained()->nullOnDelete();
                }
                if (! Schema::hasColumn('schedule_versions', 'edt_campaign_id')) {
                    $table->foreignId('edt_campaign_id')->nullable()->after('filiere_id')->constrained('edt_campaigns')->nullOnDelete();
                }
            });
        }

        if (Schema::hasTable('schedules')) {
            Schema::table('schedules', function (Blueprint $table) {
                if (! Schema::hasColumn('schedules', 'confirmation_status')) {
                    $table->string('confirmation_status', 20)->default('pending');
                }
                if (! Schema::hasColumn('schedules', 'confirmed_at')) {
                    $table->timestamp('confirmed_at')->nullable();
                }
                if (! Schema::hasColumn('schedules', 'confirmation_note')) {
                    $table->string('confirmation_note', 500)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('schedules')) {
            Schema::table('schedules', function (Blueprint $table) {
                foreach (['confirmation_status', 'confirmed_at', 'confirmation_note'] as $column) {
                    if (Schema::hasColumn('schedules', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('schedule_versions')) {
            Schema::table('schedule_versions', function (Blueprint $table) {
                if (Schema::hasColumn('schedule_versions', 'edt_campaign_id')) {
                    $table->dropConstrainedForeignId('edt_campaign_id');
                }
                if (Schema::hasColumn('schedule_versions', 'filiere_id')) {
                    $table->dropConstrainedForeignId('filiere_id');
                }
            });
        }

        Schema::dropIfExists('edt_campaigns');
    }
};
