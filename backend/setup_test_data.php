<?php
use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\Professor;
use App\Models\Department;
use App\Models\Module;
use App\Models\ProfessorAssignment;
use App\Models\User;

$year = AcademicYear::where('is_current', true)->first();
if (!$year) $year = AcademicYear::first();

// 1. Assign Students to 2 Groups per Filiere
$filieres = Filiere::all();
$students = Student::all();
$studentsPerFiliere = max(1, floor($students->count() / max(1, $filieres->count())));
$studentChunks = $students->chunk($studentsPerFiliere);

foreach($filieres as $index => $filiere) {
    // Create 2 groups
    $g1 = Group::firstOrCreate(['filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'name' => 'Groupe A - ' . $filiere->code], ['capacity' => 40, 'semester_number' => 1]);
    $g2 = Group::firstOrCreate(['filiere_id' => $filiere->id, 'academic_year_id' => $year->id, 'name' => 'Groupe B - ' . $filiere->code], ['capacity' => 40, 'semester_number' => 1]);
    
    if (isset($studentChunks[$index])) {
        $filiereStudents = $studentChunks[$index];
        $groupSize = max(1, floor($filiereStudents->count() / 2));
        
        foreach($filiereStudents->values() as $i => $student) {
            $assignedGroup = ($i < $groupSize) ? $g1 : $g2;
            StudentPathway::updateOrCreate(
                ['student_id' => $student->id, 'academic_year_id' => $year->id],
                [
                    'filiere_id' => $filiere->id,
                    'group_id' => $assignedGroup->id,
                    'current_semester' => 1,
                    'is_current' => true
                ]
            );
        }
    }
}

// 2. Assign Professors to Departments
$professors = Professor::all();
$departments = Department::all();

if ($departments->count() > 0 && $professors->count() > 0) {
    foreach($professors as $i => $prof) {
        $dept = $departments[$i % $departments->count()];
        $prof->update(['department_id' => $dept->id]);
    }
}

echo "Done assigning students and professors!\n";
exit(0);
