<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$tables = DB::select('SHOW TABLES');
$dbName = env('DB_DATABASE', 'encg_erp');
$schema = [];

foreach ($tables as $tableInfo) {
    $tableName = (array) $tableInfo;
    $tableName = array_values($tableName)[0];

    $columns = DB::select("SHOW COLUMNS FROM `$tableName`");
    $indexes = DB::select("SHOW INDEX FROM `$tableName`");
    
    // Foreign Keys
    $fks = DB::select("
        SELECT 
            kcu.COLUMN_NAME, 
            kcu.REFERENCED_TABLE_NAME, 
            kcu.REFERENCED_COLUMN_NAME,
            rc.UPDATE_RULE,
            rc.DELETE_RULE
        FROM 
            information_schema.KEY_COLUMN_USAGE kcu
        JOIN information_schema.REFERENTIAL_CONSTRAINTS rc 
            ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME 
            AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
        WHERE 
            kcu.TABLE_SCHEMA = ? 
            AND kcu.TABLE_NAME = ?
            AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    ", [$dbName, $tableName]);

    $schema[$tableName] = [
        'columns' => $columns,
        'indexes' => $indexes,
        'foreign_keys' => $fks
    ];
}

file_put_contents(__DIR__.'/db_schema_dump.json', json_encode($schema, JSON_PRETTY_PRINT));
echo "Schema dumped to db_schema_dump.json\n";
