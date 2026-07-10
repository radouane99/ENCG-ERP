<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Student;
use App\Models\Group;
use App\Models\StudentPathway;

class SeedStudentsCommand extends Command
{
    protected $signature = 'app:seed-students';
    protected $description = 'Assign 20 students to each filiere, split into 2 groups';

    public function handle()
    {
        $academicYear = AcademicYear::where('is_current', true)->first();
        if (!$academicYear) {
            $this->error('No current academic year found.');
            return;
        }

        $filieres = Filiere::all();
        $students = Student::all();
        $studentIndex = 0;
        
        $this->info("Found {$filieres->count()} filieres and {$students->count()} students.");

        foreach ($filieres as $filiere) {
            for ($i = 1; $i <= 2; $i++) {
                $group = Group::firstOrCreate([
                    'name' => "Groupe {$i} - {$filiere->code}",
                    'academic_year_id' => $academicYear->id,
                ]);
                
                for ($j = 0; $j < 10; $j++) {
                    if (!isset($students[$studentIndex])) {
                        $this->warn("Ran out of students at index {$studentIndex}");
                        break 3;
                    }
                    
                    $student = $students[$studentIndex++];
                    
                    StudentPathway::updateOrCreate(
                        ['student_id' => $student->id, 'academic_year_id' => $academicYear->id],
                        ['filiere_id' => $filiere->id, 'current_semester' => 1, 'group_id' => $group->id, 'is_current' => true]
                    );
                }
            }
            $this->info("Assigned 20 students to {$filiere->name}");
        }
        
        $this->info("Successfully assigned {$studentIndex} students.");
    }
}
