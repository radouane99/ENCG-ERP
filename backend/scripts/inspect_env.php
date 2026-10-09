<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== ROOMS ===\n";
foreach (App\Models\Room::orderBy('type')->orderBy('name')->get() as $r) {
    echo "ID: {$r->id} | Name: {$r->name} | Code: {$r->code} | Type: {$r->type} | Capacity: {$r->capacity}\n";
}

echo "\n=== PROFESSORS ===\n";
foreach (App\Models\Professor::with('user', 'department')->get() as $p) {
    $name = $p->user ? "{$p->user->first_name} {$p->user->last_name}" : 'No user';
    $dept = $p->department ? $p->department->code : 'None';
    echo "ID: {$p->id} | Name: {$name} | Dept: {$dept} | Specialty: {$p->specialty}\n";
}

echo "\n=== FILIERES & GROUPS ===\n";
foreach (App\Models\Filiere::with('groups')->get() as $f) {
    $grps = $f->groups->pluck('name')->implode(', ');
    echo "Filiere: {$f->code} ({$f->name}) | Groups: [{$grps}]\n";
}

echo "\n=== MODULES (Current Semester / Year) ===\n";
$currYear = App\Models\AcademicYear::where('is_current', true)->first();
$modules = App\Models\Module::with('filiere')->get();
echo "Total modules: " . $modules->count() . "\n";
foreach ($modules as $m) {
    echo "- ID: {$m->id} | {$m->code} : {$m->name} | Filiere: {$m->filiere?->code} | Sem: S{$m->semester_number} | CM: {$m->hours_cm}h, TD: {$m->hours_td}h\n";
}
