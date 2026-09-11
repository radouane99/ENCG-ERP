<?php

use App\Models\Grade;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$student = User::where('email', 'student@encg-fes.ma')->first()?->student;

echo '=== REGISTRATIONS ==='.PHP_EOL;
$regs = StudentRegistration::with(['filiere', 'academicYear', 'group'])->where('student_id', $student->id)->get();
echo 'Count: '.$regs->count().PHP_EOL;
foreach ($regs as $r) {
    echo '- Filiere: '.($r->filiere?->name ?? 'N/A').' | Group: '.($r->group?->name ?? 'N/A')." | Status: {$r->status} | Year: ".($r->academicYear?->displayLabel() ?? 'N/A').PHP_EOL;
}

echo '=== PATHWAYS ==='.PHP_EOL;
$pathways = StudentPathway::where('student_id', $student->id)->get();
echo 'Pathways count: '.$pathways->count().PHP_EOL;
foreach ($pathways as $p) {
    echo "- Sem: {$p->semester} | Year: {$p->academic_year} | Decision: {$p->annual_decision} | Filiere ID: {$p->filiere_id}".PHP_EOL;
}

echo '=== GRADES ==='.PHP_EOL;
$grades = Grade::with('module')->where('student_id', $student->id)->get();
echo 'Grades count: '.$grades->count().PHP_EOL;
foreach ($grades as $g) {
    echo '- Mod: '.($g->module?->name ?? 'NULL')." | Value: {$g->grade_value} | Decision: {$g->status}".PHP_EOL;
}
