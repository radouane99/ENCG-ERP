<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\ProfessorAvailability;
use App\Models\AcademicYear;

class ProfessorAvailabilitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the current academic year
        $academicYear = AcademicYear::where('is_current', true)->first();
        $academicYearId = $academicYear ? $academicYear->id : 1;

        // Get all users who are professors
        $professors = User::whereHas('roles', function($q) {
            $q->where('name', 'professor');
        })->get();

        $days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        $slots = [
            ['08:00:00', '10:00:00'],
            ['10:00:00', '12:00:00'],
            ['14:00:00', '16:00:00'],
            ['16:00:00', '18:00:00'],
        ];

        foreach ($professors as $prof) {
            $numSlots = 4;
            
            // First update or create the general availability status for this professor
            $status = ProfessorAvailability::updateOrCreate(
                ['professor_id' => $prof->id, 'academic_year_id' => $academicYearId, 'day_of_week' => null, 'start_time' => null],
                ['status' => 'Soumise', 'available_slots_count' => $numSlots]
            );
            
            // Randomly select $numSlots days
            $selectedDays = (array) array_rand(array_flip($days), $numSlots);
            
            foreach ($selectedDays as $day) {
                // Randomly select a slot
                $slot = $slots[array_rand($slots)];
                
                ProfessorAvailability::updateOrCreate([
                    'professor_id' => $prof->id,
                    'academic_year_id' => $academicYearId,
                    'day_of_week' => $day,
                    'start_time' => $slot[0],
                    'end_time' => $slot[1]
                ], [
                    'is_available' => true,
                    'status' => 'Soumise',
                    'available_slots_count' => $numSlots
                ]);
            }
        }
    }
}
