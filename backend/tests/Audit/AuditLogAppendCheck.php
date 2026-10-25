<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$baseline = json_decode(file_get_contents(storage_path('app/before-pv-absence-20261025.json')), true, flags: JSON_THROW_ON_ERROR)['audit_logs'];
$quote = fn ($value) => '"'.str_replace('"', '""', $value).'"';
DB::statement('BEGIN READ ONLY');
try {
    $fields = implode(',', array_map($quote, $baseline['columns']));
    $sql = 'SELECT count(*) AS count, md5(COALESCE(string_agg(j::text, \'\' ORDER BY j::text), \'\')) AS hash FROM (SELECT to_jsonb(r) AS j FROM (SELECT '.$fields.' FROM audit_logs ORDER BY id LIMIT '.(int) $baseline['count'].') AS r) AS records';
    $original = DB::selectOne($sql);
    $unchanged = (int) $original->count === $baseline['count'] && $original->hash === $baseline['hash'];
    echo json_encode(['database' => DB::connection()->getDatabaseName(), 'original_audit_rows_unchanged' => $unchanged,
        'appended_rows' => DB::table('audit_logs')->count() - $baseline['count'],
        'latest_events' => DB::table('audit_logs')->orderByDesc('id')->limit(3)->get(['action', 'method', 'response_status', 'created_at'])], JSON_UNESCAPED_UNICODE).PHP_EOL;
    if (! $unchanged) {
        throw new RuntimeException('Historical audit rows changed.');
    }
} finally {
    DB::statement('ROLLBACK');
}
