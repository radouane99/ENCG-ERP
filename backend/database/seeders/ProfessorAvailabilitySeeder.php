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

        $professors = User::whereHas('roles', function($q) {
            $q->whereIn('name', ['professor', 'department-head', 'vacataire', 'doctorant']);
        })->get();

        foreach ($professors as $prof) {
            $status = ProfessorAvailability::updateOrCreate(
                ['professor_id' => $prof->id, 'academic_year_id' => $academicYearId],
                [
                    'status' => 'Soumise', 
                    'available_slots_count' => rand(5, 12),
                    'availability_data' => json_encode(['mock' => true]),
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        $this->command->info('Disponibilités des professeurs générées avec succès !');
    }
}
