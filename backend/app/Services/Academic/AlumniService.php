<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;
use App\Models\Alumni; // Assuming this model exists or links to Student
use Illuminate\Database\Eloquent\Collection;

class AlumniService
{
    /**
     * Get key dashboard statistics for the Alumni network.
     */
    public function getDashboardStats(): array
    {
        // Mocked statistics for the dashboard
        return [
            'total_alumni' => 8500,
            'employed_percentage' => 92, // 92% employed within 6 months
            'top_sectors' => [
                ['name' => 'Audit & Conseil', 'percentage' => 35],
                ['name' => 'Finance de Marché', 'percentage' => 25],
                ['name' => 'Marketing Digital', 'percentage' => 20],
                ['name' => 'Entrepreneuriat', 'percentage' => 10],
                ['name' => 'Autres', 'percentage' => 10],
            ],
            'average_starting_salary' => '12 000 MAD'
        ];
    }

    /**
     * Get the directory of alumni with optional filters.
     */
    public function getAlumniDirectory(array $filters = []): Collection
    {
        // In a real scenario:
        // $query = Alumni::with('student', 'currentCompany');
        // if (isset($filters['promotion'])) $query->where('promotion_year', $filters['promotion']);
        // return $query->get();

        // Returning an empty collection since we'll mock the data in frontend for demo
        return collect([]);
    }
}
