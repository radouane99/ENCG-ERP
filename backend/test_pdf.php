<?php

use App\Models\Student;
use App\Models\AcademicYear;
use App\Services\DocumentGeneratorService;

$student = Student::first();
$year = AcademicYear::where('is_current', true)->first();

if (!$student || !$year) {
    echo "No student or academic year found.\n";
    exit(1);
}

$service = app(DocumentGeneratorService::class);
echo "Generating transcript for student ID " . $student->id . "...\n";
$path = $service->generateTranscript($student, $year->id);

echo "PDF generated at: " . $path . "\n";
