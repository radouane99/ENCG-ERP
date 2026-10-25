<?php

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

$database = DB::connection()->getDatabaseName();
if ($database !== 'encg_erp' && ! str_ends_with($database, '_test')) {
    throw new RuntimeException('Unexpected database.');
}
$path = storage_path('app/'.basename(getenv('ROLE_BASELINE_FILE') ?: 'role-baseline-'.$database.'.json'));
$mode = getenv('ROLE_SNAPSHOT_MODE') ?: 'verify';
$quote = fn ($value) => '"'.str_replace('"', '""', $value).'"';
DB::statement('BEGIN READ ONLY');
try {
    if ($mode === 'capture') {
        $columns = DB::select("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position");
        $definitions = [];
        $skip = ['migrations', 'sessions', 'cache', 'cache_locks', 'jobs', 'failed_jobs', 'job_batches', 'personal_access_tokens', 'password_reset_tokens'];
        foreach ($columns as $column) {
            if (! in_array($column->table_name, $skip, true)) {
                $definitions[$column->table_name][] = $column->column_name;
            }
        }
    } else {
        $baseline = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
        $definitions = array_map(fn ($row) => $row['columns'], $baseline);
    }
    $snapshot = [];
    $changed = [];
    foreach ($definitions as $table => $fields) {
        $sql = 'SELECT count(*) AS count, md5(COALESCE(string_agg(j::text, \'\' ORDER BY j::text), \'\')) AS hash FROM (SELECT to_jsonb(r) AS j FROM (SELECT '.implode(',', array_map($quote, $fields)).' FROM public.'.$quote($table).') AS r) AS records';
        $result = DB::selectOne($sql);
        $snapshot[$table] = ['columns' => $fields, 'count' => (int) $result->count, 'hash' => $result->hash];
        if ($mode !== 'capture' && ($snapshot[$table]['count'] !== $baseline[$table]['count'] || $snapshot[$table]['hash'] !== $baseline[$table]['hash'])) {
            $changed[] = $table;
        }
    }
    if ($mode === 'capture') {
        file_put_contents($path, json_encode($snapshot, JSON_PRETTY_PRINT));
    }
    echo json_encode(['database' => $database, 'mode' => $mode, 'tables_checked' => count($snapshot), 'changed_tables' => $changed, 'grades' => $snapshot['grades']['count'] ?? null]).PHP_EOL;
    if ($changed) {
        throw new RuntimeException('Existing data changed: '.implode(', ', $changed));
    }
} finally {
    DB::statement('ROLLBACK');
}
