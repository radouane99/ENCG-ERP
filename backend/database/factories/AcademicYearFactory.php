<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Factories\Factory;

class AcademicYearFactory extends Factory
{
    protected $model = AcademicYear::class;

    protected static int $nextYear = 2031;

    public function definition(): array
    {
        $startYear = static::$nextYear++;
        $endYear = $startYear + 1;

        return [
            'institution_id' => 1,
            'label' => "{$startYear}/{$endYear}",
            'start_year' => $startYear,
            'end_year' => $endYear,
            'start_date' => "{$startYear}-09-01",
            'end_date' => "{$endYear}-06-30",
            'is_current' => false,
            'is_locked' => false,
        ];
    }
}
