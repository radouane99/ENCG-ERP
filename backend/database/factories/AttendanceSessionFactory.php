<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use App\Models\AttendanceSession;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceSession>
 */
class AttendanceSessionFactory extends Factory
{
    protected $model = AttendanceSession::class;

    public function definition(): array
    {
        $professor = Professor::factory()->create();
        $user = User::factory()->create();
        $academicYear = AcademicYear::query()->firstOrCreate(
            ['institution_id' => 1, 'start_year' => 2026],
            [
                'label' => '2026/2027',
                'end_year' => 2027,
                'start_date' => '2026-09-01',
                'end_date' => '2027-06-30',
                'is_current' => true,
            ]
        );
        $filiere = Filiere::query()->firstOrCreate(
            ['code' => 'MGT'],
            [
                'institution_id' => 1,
                'name' => 'Management',
                'type' => 'grande_ecole',
                'duration_years' => 5,
            ]
        );
        $module = Module::firstOrCreate(
            ['code' => 'M101'],
            [
                'institution_id' => 1,
                'filiere_id' => $filiere->id,
                'name' => 'Marketing Digital',
                'semester_number' => 1,
                'coefficient' => 1,
                'credit_hours' => 45,
            ]
        );
        $group = Group::query()->first()
            ?? Group::create([
                'academic_year_id' => $academicYear->id,
                'filiere_id' => $filiere->id,
                'semester_number' => 1,
                'name' => 'Groupe 1',
                'capacity' => 60,
            ]);

        return [
            'module_id' => $module->id,
            'group_id' => $group->id,
            'academic_year_id' => $academicYear->id,
            'professor_id' => $professor->id,
            'professor_type' => Professor::class,
            'session_date' => now()->toDateString(),
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
            'session_type' => fake()->randomElement(['cm', 'td', 'tp']),
            'created_by' => $user->id,
            'module_name' => fake()->randomElement(['Marketing Digital', 'Finance d\'Entreprise', 'Management Stratégique', 'Informatique de Gestion']),
            'group_name' => 'G'.fake()->numberBetween(1, 6),
            'room_name' => fake()->optional()->randomElement(['Salle A', 'Salle B', 'Amphi 1']),
            'status' => 'active',
        ];
    }

    public function closed(): static
    {
        return $this->state(['status' => 'closed']);
    }
}
