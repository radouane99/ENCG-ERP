<?php

namespace Database\Factories;

use App\Models\Professor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Professor>
 */
class ProfessorFactory extends Factory
{
    protected $model = Professor::class;

    public function definition(): array
    {
        $year = date('Y');
        static $count = 0;
        $count++;

        return [
            'user_id'         => User::factory(),
            'employee_number' => 'PROF-' . $year . '-' . str_pad($count, 3, '0', STR_PAD_LEFT),
            'grade'           => fake()->randomElement(['Professeur', 'Maître de Conférences', 'Docteur']),
            'specialty'       => fake()->optional()->randomElement(['Marketing', 'Finance', 'Informatique', 'Management']),
            'contract_type'   => fake()->randomElement(['permanent', 'contractual', 'visiting']),
            'hire_date'       => fake()->dateTimeBetween('-10 years', 'now')->format('Y-m-d'),
            'is_active'       => true,
            'institution_id'  => 1,
        ];
    }

    public function active(): static
    {
        return $this->state(['is_active' => true]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
