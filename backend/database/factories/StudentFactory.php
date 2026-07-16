<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        $year = date('Y');
        static $count = 0;
        $count++;

        return [
            'user_id'         => User::factory(),
            'student_number'  => $year . str_pad($count, 4, '0', STR_PAD_LEFT),
            'cne'             => strtoupper(fake()->unique()->bothify('??#####')),
            'massar_code'     => fake()->optional()->bothify('G########'),
            'gender'          => fake()->randomElement(['male', 'female']),
            'status'          => 'active',
            'scholarship_type'=> null,
            'institution_id'  => 1,
        ];
    }

    public function active(): static
    {
        return $this->state(['status' => 'active']);
    }

    public function graduated(): static
    {
        return $this->state(['status' => 'graduated']);
    }
}
