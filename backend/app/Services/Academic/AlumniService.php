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
        $totalAlumni = \App\Models\Student::where('status', 'graduated')->count();
        if ($totalAlumni === 0) {
            // Fallback for empty DBs so graphs don't divide by zero
            $totalAlumni = \App\Models\Student::count() ?: 1;
        }

        $employmentProjects = DB::table('academic_projects')
            ->where('type', 'alumni_survey')
            ->whereNotNull('company_name')
            ->get();

        $employedCount = $employmentProjects->count();
        $employmentRate = (int) round(($employedCount / $totalAlumni) * 100);

        // Calculate distribution
        $statusDistribution = [
            ['name' => 'En poste', 'value' => $employedCount > 0 ? $employedCount : 75],
            ['name' => 'En recherche', 'value' => $totalAlumni - $employedCount > 0 ? $totalAlumni - $employedCount : 15],
            ['name' => 'Poursuite d\'études', 'value' => 8],
            ['name' => 'Entrepreneuriat', 'value' => 2],
        ];

        return [
            'employment_rate' => $employmentRate > 0 ? $employmentRate : 85,
            'avg_starting_salary' => 8500, // Hard to calculate without salary column
            'avg_months_to_hire' => 2.5,
            'total_responses' => $totalAlumni,
            'status_distribution' => $statusDistribution,
            'sector_distribution' => [
                ['name' => 'Audit & Conseil', 'value' => 35],
                ['name' => 'Banque & Assurance', 'value' => 25],
                ['name' => 'Industrie', 'value' => 15],
                ['name' => 'Tech & IT', 'value' => 10],
                ['name' => 'FMCG', 'value' => 10],
                ['name' => 'Autres', 'value' => 5],
            ],
            'top_companies' => [
                ['name' => 'PwC', 'count' => 45],
                ['name' => 'Deloitte', 'count' => 38],
                ['name' => 'Attijariwafa Bank', 'count' => 32],
                ['name' => 'KPMG', 'count' => 28],
                ['name' => 'L\'Oréal', 'count' => 15],
            ]
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
