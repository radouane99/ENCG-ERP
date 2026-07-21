<?php

namespace App\Services\Academic;

use App\Models\AcademicProject;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;

class AlumniService
{
    /**
     * Get key dashboard statistics for the Alumni network.
     */
    public function getDashboardStats(): array
    {
        $totalResponses = AcademicProject::where('type', 'alumni_survey')->count();

        $employmentProjects = AcademicProject::where('type', 'alumni_survey')
            ->whereNotNull('company_name')
            ->get();

        $employedCount = $employmentProjects->count();
        $employmentRate = $totalResponses > 0 ? (int) round(($employedCount / $totalResponses) * 100) : 0;

        $avgStartingSalary = (float) AcademicProject::where('type', 'alumni_survey')
            ->whereNotNull('starting_salary')
            ->avg('starting_salary');

        $avgMonthsToHire = (float) AcademicProject::where('type', 'alumni_survey')
            ->whereNotNull('months_to_hire')
            ->avg('months_to_hire');

        $statusDistribution = AcademicProject::where('type', 'alumni_survey')
            ->select('employment_status as name', DB::raw('count(*) as value'))
            ->groupBy('employment_status')
            ->get()
            ->map(fn ($row) => ['name' => $row->name ?? 'N/A', 'value' => (int) $row->value])
            ->toArray();

        $sectorDistribution = AcademicProject::where('type', 'alumni_survey')
            ->select('sector as name', DB::raw('count(*) as value'))
            ->whereNotNull('sector')
            ->groupBy('sector')
            ->orderByDesc('value')
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'value' => (int) $row->value])
            ->toArray();

        $topCompanies = AcademicProject::where('type', 'alumni_survey')
            ->select('company_name as name', DB::raw('count(*) as count'))
            ->whereNotNull('company_name')
            ->groupBy('company_name')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->toArray();

        return [
            'employment_rate' => $employmentRate,
            'avg_starting_salary' => $avgStartingSalary,
            'avg_months_to_hire' => $avgMonthsToHire,
            'total_responses' => $totalResponses,
            'status_distribution' => $statusDistribution,
            'sector_distribution' => $sectorDistribution,
            'top_companies' => $topCompanies,
        ];
    }

    /**
     * Get the directory of alumni with optional filters.
     */
    public function getAlumniDirectory(array $filters = []): Collection
    {
        $query = AcademicProject::with(['student.user', 'academicYear'])
            ->where('type', 'alumni_survey');

        if (!empty($filters['promotion'])) {
            $query->where('graduation_year', $filters['promotion']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('company_name', 'like', '%' . $filters['search'] . '%')
                    ->orWhereHas('student.user', function ($userQuery) use ($filters) {
                        $userQuery->where('first_name', 'like', '%' . $filters['search'] . '%')
                            ->orWhere('last_name', 'like', '%' . $filters['search'] . '%');
                    });
            });
        }

        return $query->orderByDesc('created_at')->limit(100)->get();
    }
}
