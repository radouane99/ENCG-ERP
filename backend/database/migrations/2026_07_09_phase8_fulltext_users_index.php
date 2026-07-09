<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * [Phase 8] Add FULLTEXT index to users table.
 *
 * A FULLTEXT index allows efficient natural-language search on the users table.
 * This replaces the leading-wildcard LIKE '%search%' pattern (which prevents
 * index use) with a MATCH ... AGAINST query pattern.
 *
 * NOTE: FULLTEXT is only supported by InnoDB (MySQL 5.6+) and MyISAM.
 * This migration is guarded for MySQL only.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Only run on MySQL — FULLTEXT is not supported by SQLite (used in testing)
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Add FULLTEXT index on the user search columns
        // We use DB::statement because Blueprint doesn't have a native fullText() on all versions
        DB::statement('ALTER TABLE `users` ADD FULLTEXT INDEX `users_fulltext_search` (`first_name`, `last_name`, `email`)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE `users` DROP INDEX `users_fulltext_search`');
    }
};
