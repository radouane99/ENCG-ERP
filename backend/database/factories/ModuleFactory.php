<?php

namespace Database\Factories;

use App\Models\Filiere;
use App\Models\Module;
use App\Models\Semester;
use Illuminate\Database\Eloquent\Factories\Factory;

class ModuleFactory extends Factory
{
    protected $model = Module::class;

    public function definition(): array
    {
        return [
            'institution_id'   => 1,
            'filiere_id'       => Filiere::factory(),
            'name'             => fake()->words(3, true),
            'code'             => 'MOD-' . fake()->unique()->numerify('###'),
            'semester_number'  => 1,
            'coefficient'      => 1.00,
            'credit_hours'     => 45,
            'is_active'        => true,
        ];
    }
}
