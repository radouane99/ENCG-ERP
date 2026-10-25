<?php

// Read-only structural inventory; no controller action is executed.
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

$missing = [];
$total = 0;
$controllers = [];
foreach (Route::getRoutes() as $route) {
    $action = $route->getActionName();
    if (! str_starts_with($action, 'App\\') || ! str_contains($action, '@')) {
        continue;
    }
    $total++;
    [$class, $method] = explode('@', $action, 2);
    $controllers[$class] = true;
    if (! class_exists($class) || ! method_exists($class, $method)) {
        $missing[] = ['methods' => $route->methods(), 'uri' => $route->uri(), 'action' => $action];
    }
}
$summary = ['controller_routes' => $total, 'distinct_controllers' => count($controllers), 'missing_action_routes' => $missing];
DB::statement('BEGIN READ ONLY');
try {
    $summary['source_counts'] = [];
    foreach (['students', 'professors', 'grades', 'student_registrations', 'student_pathways', 'grade_appeals', 'internships', 'soutenances', 'professor_availabilities', 'specialty_wishes', 'filiere_quotas'] as $table) {
        if (Schema::hasTable($table)) {
            $summary['source_counts'][$table] = DB::table($table)->count();
        }
    }
    $summary['availability_without_professor_user'] = DB::table('professor_availabilities as a')->whereNotExists(fn ($q) => $q->selectRaw('1')->from('professors as p')->whereColumn('p.user_id', 'a.professor_id'))->count();
} finally {
    DB::statement('ROLLBACK');
}
echo json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
