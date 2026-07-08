<?php

namespace Database\Factories;

use App\Models\AttendanceSession;
use App\Models\Professor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceSession>
 */
class AttendanceSessionFactory extends Factory
{
    protected $model = AttendanceSession::class;

    public function definition(): array
    {
        return [
            'professor_id' => Professor::factory(),
            'module_name'  => fake()->randomElement(['Marketing Digital', 'Finance d\'Entreprise', 'Management Stratégique', 'Informatique de Gestion']),
            'group_name'   => 'G' . fake()->numberBetween(1, 6),
            'room_name'    => fake()->optional()->randomElement(['Salle A', 'Salle B', 'Amphi 1']),
            'status'       => 'active',
            'session_type' => fake()->randomElement(['cm', 'td', 'tp']),
            'started_at'   => now()->subHour(),
        ];
    }

    public function closed(): static
    {
        return $this->state(['status' => 'closed']);
    }
}
