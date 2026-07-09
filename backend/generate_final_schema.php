<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$tables = Schema::getTables();
$schemaData = [];

foreach ($tables as $table) {
    $tableName = $table['name'];
    
    // Skip migration and internal tables
    if (in_array($tableName, ['migrations', 'password_reset_tokens', 'personal_access_tokens', 'failed_jobs'])) {
        continue;
    }
    
    $columns = Schema::getColumns($tableName);
    $foreignKeys = Schema::getForeignKeys($tableName);
    $indexes = Schema::getIndexes($tableName);
    
    $schemaData[$tableName] = [
        'columns' => $columns,
        'foreign_keys' => $foreignKeys,
        'indexes' => $indexes
    ];
}

file_put_contents('final_schema.json', json_encode($schemaData, JSON_PRETTY_PRINT));
echo "Schema exported to final_schema.json\n";
