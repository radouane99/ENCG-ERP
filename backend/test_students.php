<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$output = "";
try {
    $academicYear = \App\Models\AcademicYear::where("is_current", true)->first();
    if (!$academicYear) {
        $output .= "No current academic year found.\n";
    } else {
        $filieres = \App\Models\Filiere::all();
        $students = \App\Models\Student::all();
        $studentIndex = 0;
        
        $output .= "Found " . $filieres->count() . " filieres and " . $students->count() . " students.\n";

        foreach ($filieres as $filiere) {
            for ($i = 1; $i <= 2; $i++) {
                $group = \App\Models\Group::firstOrCreate([
                    "name" => "Groupe " . $i . " - " . $filiere->code,
                    "academic_year_id" => $academicYear->id,
                ]);
                for ($j = 0; $j < 10; $j++) {
                    if (!isset($students[$studentIndex])) break 3;
                    $student = $students[$studentIndex++];
                    \App\Models\StudentPathway::updateOrCreate(
                        ["student_id" => $student->id, "academic_year_id" => $academicYear->id],
                        ["filiere_id" => $filiere->id, "current_semester" => 1, "group_id" => $group->id, "is_current" => true]
                    );
                }
            }
        }
        $output .= "Assigned " . $studentIndex . " students\n";
    }
} catch (\Throwable $e) {
    $output .= "Error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine() . "\n";
}

file_put_contents("test_out.txt", $output);
