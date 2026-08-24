<?php

use App\Models\AcademicYear;
use App\Models\DocumentRequest;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Student;
use App\Models\StudentPathway;
use Illuminate\Support\Facades\Route;

if (! app()->environment('testing')) {
    return;
}

Route::get('/test-doc', function () {
    $reqs = DocumentRequest::where('status', 'pending')->get();

    return response()->json($reqs);
});

Route::get('/seed-students', function () {
    $academicYear = AcademicYear::where('is_current', true)->first();
    if (! $academicYear) {
        return response()->json(['error' => 'No current academic year.'], 400);
    }

    $filieres = Filiere::all();
    $students = Student::all();
    $studentIndex = 0;
    $log = [];

    foreach ($filieres as $filiere) {
        $assignedCount = 0;
        for ($i = 1; $i <= 2; $i++) {
            $group = Group::firstOrCreate(
                [
                    'name' => 'Groupe '.$i.' - '.$filiere->code,
                    'academic_year_id' => $academicYear->id,
                ],
                [
                    'filiere_id' => $filiere->id,
                    'semester_number' => 1,
                ]
            );
            for ($j = 0; $j < 10; $j++) {
                if (! isset($students[$studentIndex])) {
                    break 3;
                }

                $student = $students[$studentIndex++];
                StudentPathway::updateOrCreate(
                    ['student_id' => $student->id, 'academic_year_id' => $academicYear->id],
                    ['filiere_id' => $filiere->id, 'current_semester' => 1, 'group_id' => $group->id, 'is_current' => true]
                );
                $assignedCount++;
            }
        }
        $log[] = "Assigned {$assignedCount} students to {$filiere->name}.";
    }

    return response()->json(['log' => $log, 'total_assigned' => $studentIndex]);
});
