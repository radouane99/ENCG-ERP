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

        // Get existing groups or create new ones
        $groups = Group::where('academic_year_id', $academicYear->id)->get();
        
        if ($groups->isEmpty()) {
            $groupNames = ['A', 'B', 'C', 'D'];
            $groups = collect();
            foreach ($filieres as $index => $filiere) {
                for ($i = 0; $i < 2; $i++) {
                    if ($groups->count() >= 10) break;
                    
                    $groups->push(Group::create([
                        'filiere_id' => $filiere->id,
                        'academic_year_id' => $academicYear->id,
                        'name' => "Groupe {$groupNames[$i]} - {$filiere->code}",
                        'semester_number' => 1,
                        'capacity' => 30,
                    ]));
                }
            }
        }

        // Get students that are NOT already registered for this academic year
        $alreadyRegistered = StudentRegistration::where('academic_year_id', $academicYear->id)
            ->pluck('student_id')
            ->toArray();
        
        $students = Student::whereNotIn('id', $alreadyRegistered)->get();
        
        if ($students->isEmpty()) {
            return; // All students already enrolled
        }

        $studentsPerGroup = max(1, ceil($students->count() / $groups->count()));
        $studentChunks = $students->chunk($studentsPerGroup);

        DB::transaction(function () use ($studentChunks, $groups, $academicYear) {
            foreach ($groups as $index => $group) {
                if (!isset($studentChunks[$index])) continue;
                
                foreach ($studentChunks[$index] as $student) {
                    StudentRegistration::firstOrCreate([
                        'student_id' => $student->id,
                        'academic_year_id' => $academicYear->id,
                        'semester_number' => 1,
                    ], [
                        'filiere_id' => $group->filiere_id,
                        'group_id' => $group->id,
                        'status' => 'registered',
                        'registration_type' => 'initial',
                    ]);
                }
            }
        });
    }
}
