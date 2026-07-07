<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\Semester;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = AcademicYear::where('is_current', true)->first();
        if (!$academicYear) return;

        $semester = Semester::where('academic_year_id', $academicYear->id)
            ->where('is_current', true)->first();
        if (!$semester) return;

        $groups = Group::where('academic_year_id', $academicYear->id)->get();
        $professors = Professor::all();
        $rooms = Room::all();
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        foreach ($groups as $group) {
            $filiereModules = Module::where('filiere_id', $group->filiere_id)->get();
            if ($filiereModules->isEmpty()) continue;

            // Generate 3 sessions per group
            for ($i = 0; $i < 3; $i++) {
                $module = $filiereModules->random();
                $prof = $professors->random();
                $room = $rooms->random();
                $dayOfWeek = $days[array_rand($days)];
                
                $startTime = Carbon::createFromTime(rand(8, 14), 0, 0);
                $endTime = (clone $startTime)->addHours(2);

                Schedule::create([
                    'academic_year_id' => $academicYear->id,
                    'semester_id' => $semester->id,
                    'module_id' => $module->id,
                    'professor_id' => $prof->id,
                    'group_id' => $group->id,
                    'room_id' => $room->id,
                    'day_of_week' => $dayOfWeek,
                    'start_time' => $startTime->format('H:i:s'),
                    'end_time' => $endTime->format('H:i:s'),
                    'type' => 'cm', // cours magistral
                    'is_online' => false,
                    'status' => 'scheduled',
                ]);
            }
        }
    }
}
