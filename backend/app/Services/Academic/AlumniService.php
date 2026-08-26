<?php

namespace App\Services\Academic;

use App\Models\AcademicProject;
use Illuminate\Database\Eloquent\Collection;

class AlumniService
{
    /**
     * Statistiques du tableau de bord Alumni.
     */
    public function getDashboardStats(): array
    {
        $totalResponses = AcademicProject::where('type', 'alumni_survey')->count();

        if ($totalResponses === 0) {
            return [
                'employment_rate' => 0,
                'avg_starting_salary' => 0,
                'avg_months_to_hire' => 0,
                'total_responses' => 0,
                'status_distribution' => [],
                'sector_distribution' => [],
                'top_companies' => [],
            ];
        }

        $employedCount = AcademicProject::where('type', 'alumni_survey')->whereNotNull('company_name')->count();

        return [
            'employment_rate' => (int) round(($employedCount / $totalResponses) * 100),
            'avg_starting_salary' => (float) (AcademicProject::where('type', 'alumni_survey')->whereNotNull('starting_salary')->avg('starting_salary') ?? 0),
            'avg_months_to_hire' => (float) (AcademicProject::where('type', 'alumni_survey')->whereNotNull('months_to_hire')->avg('months_to_hire') ?? 0),
            'total_responses' => $totalResponses,
            'status_distribution' => $this->getDistribution('employment_status'),
            'sector_distribution' => $this->getDistribution('sector'),
            'top_companies' => $this->getTopCompanies(),
        ];
    }

    /**
     * Annuaire des Alumni.
     */
    public function getAlumniDirectory(array $filters = []): Collection
    {
        $query = AcademicProject::with(['student.user', 'academicYear'])
            ->where('type', 'alumni_survey');

        if (! empty($filters['promotion'])) {
            $query->where('graduation_year', $filters['promotion']);
        }

        return $query->latest()->limit(100)->get();
    }

    /**
     * Distribution groupée par champ.
     */
    private function getDistribution(string $column): array
    {
        $allowed = ['employment_status', 'sector'];
        if (! in_array($column, $allowed, true)) {
            return [];
        }

        return AcademicProject::where('type', 'alumni_survey')
            ->whereNotNull($column)
            ->selectRaw($column.' as name, count(*) as value')
            ->groupBy($column)
            ->orderByDesc('value')
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'value' => (int) $row->value])
            ->toArray();
    }

    /**
     * Top entreprises.
     */
    private function getTopCompanies(): array
    {
        return AcademicProject::where('type', 'alumni_survey')
            ->whereNotNull('company_name')
            ->selectRaw('company_name as name, count(*) as count')
            ->groupBy('company_name')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->toArray();
    }
}
