<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('sso_provider', 32)->nullable()->after('last_login_ip');
            $table->string('sso_subject', 255)->nullable()->after('sso_provider');
            $table->timestamp('sso_linked_at')->nullable()->after('sso_subject');
            $table->unique(['sso_provider', 'sso_subject']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['sso_provider', 'sso_subject']);
            $table->dropColumn(['sso_provider', 'sso_subject', 'sso_linked_at']);
        });
    }
};
