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
        // Real statistics from DB
        $totalAlumni = \App\Models\Student::where('status', 'graduated')->count();
        // Fallback if nobody is graduated yet
        if ($totalAlumni === 0) {
            $totalAlumni = \App\Models\Student::count();
        }

        // Employment stats from alumni profiles if available
        $employedCount = \DB::table('alumni')
            ->whereNotNull('current_company')
            ->where('current_company', '!=', '')
            ->count();

        $employedPct = $totalAlumni > 0
            ? (int) round(($employedCount / $totalAlumni) * 100)
            : 0;

        return [
            'total_alumni'            => $totalAlumni,
            'employed_percentage'     => $employedPct ?: null,
            'top_sectors'             => [], // Will be populated when alumni sector data is collected
            'average_starting_salary' => null, // Will be populated when salary data is collected
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
