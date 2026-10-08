<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixDbSequencesCommand extends Command
{
    protected $signature = 'encg:fix-sequences';
    protected $description = 'Sync all PostgreSQL sequences with MAX(id) in all tables';

    public function handle(): int
    {
        $driver = DB::getDriverName();
        if ($driver !== 'pgsql') {
            $this->info("Database driver is {$driver}. Sequence sync is only needed for PostgreSQL.");
            return 0;
        }

        $this->info('Synchronizing PostgreSQL sequences...');

        $sequences = DB::select("
            SELECT
                t.relname AS table_name,
                s.relname AS sequence_name
            FROM pg_class s
            JOIN pg_depend d ON d.objid = s.oid
            JOIN pg_class t ON d.refobjid = t.oid
            JOIN pg_attribute a ON (d.refobjid, d.refobjsubid) = (a.attrelid, a.attnum)
            JOIN pg_namespace n ON n.oid = s.relnamespace
            WHERE s.relkind = 'S'
              AND n.nspname = 'public'
        ");

        foreach ($sequences as $seq) {
            $table = $seq->table_name;
            $sequence = $seq->sequence_name;

            try {
                $maxId = DB::table($table)->max('id') ?? 1;
                DB::statement("SELECT setval('{$sequence}', {$maxId}, true)");
                $this->line("Synced sequence <info>{$sequence}</info> for table <info>{$table}</info> -> {$maxId}");
            } catch (\Throwable $e) {
                $this->warn("Skipped {$sequence}: " . $e->getMessage());
            }
        }

        $this->info('✅ All PostgreSQL sequences are now synchronized!');
        return 0;
    }
}
