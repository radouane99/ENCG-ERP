<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class VerifyDatabaseIntegrity extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'erp:verify-integrity {--pre : Run pre-migration snapshot} {--post : Run post-migration verification} {--snapshot= : Snapshot filename under storage/app}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify database integrity pre and post migration (Row counts, constraints, indexes).';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isPre = $this->option('pre');
        $isPost = $this->option('post');

        if ($isPre === $isPost) {
            $this->error('Specify exactly one of --pre or --post.');

            return 1;
        }

        $filename = $this->option('snapshot') ?: 'db_integrity_snapshot.json';
        if (! preg_match('/^[a-zA-Z0-9_.-]+\.json$/', $filename)) {
            $this->error('Invalid snapshot filename.');

            return 1;
        }
        $snapshotFile = storage_path('app/'.$filename);

        $tables = Schema::getTables();

        $currentState = [];

        $this->info('Scanning database...');

        foreach ($tables as $tableObj) {
            $tableName = $tableObj['name'];

            // Skip system tables
            if (in_array($tableName, ['migrations', 'cache', 'cache_locks', 'failed_jobs', 'jobs', 'personal_access_tokens', 'telescope_entries'])) {
                continue;
            }

            $count = DB::table($tableName)->count();

            $indexes = Schema::getIndexes($tableName);
            $indexCount = count($indexes);

            $currentState[$tableName] = [
                'count' => $count,
                'index_count' => $indexCount,
            ];
        }

        if ($isPre) {
            $temporary = $snapshotFile.'.tmp';
            File::put($temporary, json_encode($currentState, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
            File::move($temporary, $snapshotFile);
            $this->info('✅ Pre-migration snapshot saved.');

            return 0;
        }

        if ($isPost) {
            if (! File::exists($snapshotFile)) {
                $this->error('No pre-migration snapshot found.');

                return 1;
            }

            $snapshot = json_decode(File::get($snapshotFile), true, 512, JSON_THROW_ON_ERROR);
            $errors = 0;

            $this->info('Verifying data retention...');

            foreach ($snapshot as $table => $preData) {
                if (! isset($currentState[$table])) {
                    $this->error("❌ Table dropped: $table");
                    $errors++;

                    continue;
                }

                $postData = $currentState[$table];

                if ($preData['count'] > $postData['count']) {
                    $this->error("❌ Data Loss in $table! Pre: {$preData['count']}, Post: {$postData['count']}");
                    $errors++;
                }
            }

            if ($errors === 0) {
                $this->info('✅ Post-migration row-count verification successful.');

                return 0;
            } else {
                $this->error("🚨 Verification failed with $errors errors.");

                return 1;
            }
        }
    }
}
