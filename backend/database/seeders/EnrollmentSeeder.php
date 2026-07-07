<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Models\Semester;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EnrollmentSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = AcademicYear::where('is_current', true)->first();
        if (!$academicYear) {
            $academicYear = AcademicYear::first();
        }
        
        $filieres = Filiere::all();
        $semesters = Semester::where('academic_year_id', $academicYear->id)->get();
        $currentSemester = $semesters->where('is_current', true)->first() ?? $semesters->first();

        // Create 10 Groups distributed across filieres
        $groups = collect();
        $groupNames = ['A', 'B', 'C', 'D'];
        
        foreach ($filieres as $index => $filiere) {
            for ($i = 0; $i < 2; $i++) {
                if ($groups->count() >= 10) break;
                
                $groups->push(Group::create([
                    'filiere_id' => $filiere->id,
                    'academic_year_id' => $academicYear->id,
                    'name' => "Groupe {$groupNames[$i]} - {$filiere->code}",
                    'semester_number' => 1,
                    'capacity' => 30,
                    'current_count' => 0,
                ]));
            }
        }

        // Enroll students
        $students = Student::all();
        $studentsPerGroup = ceil($students->count() / $groups->count());

        $studentChunks = $students->chunk($studentsPerGroup);

        DB::transaction(function () use ($studentChunks, $groups, $academicYear, $currentSemester) {
            foreach ($groups as $index => $group) {
                if (!isset($studentChunks[$index])) continue;
                
                foreach ($studentChunks[$index] as $student) {
                    // Create Student Registration
                    StudentRegistration::create([
                        'student_id' => $student->id,
                        'academic_year_id' => $academicYear->id,
                        'filiere_id' => $group->filiere_id,
                        'current_semester_id' => $currentSemester->id,
                        'level' => 'S1',
                        'status' => 'registered',
                        'registration_date' => now(),
                    ]);

                    // Attach to group (Many to Many)
                    $group->students()->attach($student->id, ['status' => 'active']);
                }
            }
        });
    }
}
