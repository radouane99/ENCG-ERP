<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use App\Models\Semester;
use Illuminate\Database\Eloquent\Factories\Factory;

class SemesterFactory extends Factory
{
    protected $model = Semester::class;

    public function definition(): array
    {
        return [
            'academic_year_id' => AcademicYear::factory(),
            'name'             => 'Semestre 1',
            'number'           => 1,
            'start_date'       => '2026-09-01',
            'end_date'         => '2027-01-31',
        ];
    }
}
