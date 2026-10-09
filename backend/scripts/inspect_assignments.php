<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$rows = DB::table('module_professor')
    ->join('modules', 'module_professor.module_id', '=', 'modules.id')
    ->leftJoin('groups', 'module_professor.group_id', '=', 'groups.id')
    ->join('professors', 'module_professor.professor_id', '=', 'professors.id')
    ->join('users', 'professors.user_id', '=', 'users.id')
    ->select('modules.code as m_code', 'modules.name as m_name', 'users.first_name', 'users.last_name', 'groups.name as g_name', 'module_professor.group_id', 'module_professor.session_type')
    ->orderBy('modules.code')
    ->get();

echo "Total module_professor assignments: " . $rows->count() . "\n";
foreach ($rows as $r) {
    $grp = $r->g_name ?? 'ALL_GROUPS (Cohort)';
    echo "Module: {$r->m_code} ({$r->m_name}) | Prof: {$r->first_name} {$r->last_name} | Group: {$grp} | Type: {$r->session_type}\n";
}
