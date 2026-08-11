<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Application;
use App\Models\Student;

echo "Updating candidate records to Guercif & Oriental...\n";

// Update Applications
$apps = Application::where('cne', 'H148073298')
    ->orWhere('email', 'radouane.asri99@gmail.com')
    ->get();

foreach ($apps as $a) {
    $a->update([
        'delegation' => 'Guercif',
        'province'   => 'Guercif',
        'academy'    => "ACADÉMIE L'Oriental",
        'region'     => "ACADÉMIE L'Oriental",
        'high_school'=> $a->high_school ?: 'Lycée Hassan II (Guercif)',
    ]);
    echo "Updated Application ID {$a->id}\n";
}

// Update Students
$students = Student::where('cne', 'H148073298')
    ->orWhereHas('user', fn($u) => $u->where('email', 'radouane.asri99@gmail.com'))
    ->get();

foreach ($students as $s) {
    $s->update([
        'delegation' => 'Guercif',
        'province'   => 'Guercif',
        'academy'    => "ACADÉMIE L'Oriental",
        'region'     => "ACADÉMIE L'Oriental",
        'high_school'=> $s->high_school ?: 'Lycée Hassan II (Guercif)',
    ]);
    echo "Updated Student ID {$s->id}\n";
}

echo "Done successfully!\n";
