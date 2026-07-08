<?php

namespace Database\Factories;

use App\Models\Internship;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Internship>
 */
class InternshipFactory extends Factory
{
    protected $model = Internship::class;

    public function definition(): array
    {
        return [
            'student_id'      => Student::factory(),
            'company_name'    => fake()->company(),
            'start_date'      => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'end_date'        => fake()->dateTimeBetween('now', '+6 months')->format('Y-m-d'),
            'status'          => 'pending',
            'type'            => fake()->randomElement(['initiation', 'application', 'fin_etudes']),
        ];
    }

    public function validated(): static
    {
        return $this->state(['status' => 'validated']);
    }

    public function pending(): static
    {
        return $this->state(['status' => 'pending']);
    }
}
