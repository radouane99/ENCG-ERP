<?php

namespace Database\Factories;

use App\Models\Assessment;
use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Assessment>
 */
class AssessmentFactory extends Factory
{
    protected $model = Assessment::class;

    public function definition(): array
    {
        return [
            'module_id' => Module::factory(),
            'type'      => fake()->randomElement(['CC', 'Exam', 'TP']),
            'weight'    => 50.0,
            'date'      => now()->toDateString(),
        ];
    }
}
