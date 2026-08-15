<?php

namespace Database\Factories;

use App\Models\Filiere;
use Illuminate\Database\Eloquent\Factories\Factory;

class FiliereFactory extends Factory
{
    protected $model = Filiere::class;

    public function definition(): array
    {
        return [
            'institution_id' => 1,
            'name'           => fake()->words(3, true),
            'code'           => 'FIL-' . fake()->unique()->lexify('???'),
            'type'           => 'grande_ecole',
            'duration_years' => 5,
        ];
    }
}
