<?php

namespace App\Services;

use App\Models\DocumentRequest;
use App\Models\AcademicProject;
use App\Models\Student;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsService
{
    /**
     * Cache duration in seconds (15 minutes)
     */
    protected int $cacheTtl = 900;

    public function getDashboardMetrics(): array
    {
        return Cache::remember('admin.analytics.dashboard', $this->cacheTtl, function () {
            return [
                'kpis' => $this->getKpis(),
                'document_trends' => $this->getDocumentTrends(),
                'project_distribution' => $this->getProjectDistribution(),
                'student_activity' => $this->getStudentActivity(),
            ];
        });
    }

    protected function getKpis(): array
    {
        return [
            'total_requests' => DocumentRequest::count(),
            'pending_requests' => DocumentRequest::where('status', 'pending')->count(),
            'active_students' => Student::has('user')->count(),
        ];
    }

    protected function getDocumentTrends(): array
    {
        // Monthly trends for the last 6 months
        return DocumentRequest::select(
            DB::raw('DATE_FORMAT(requested_at, "%Y-%m") as month'),
            DB::raw('count(*) as total'),
            DB::raw('SUM(CASE WHEN status = "ready" THEN 1 ELSE 0 END) as ready')
        )
        ->where('requested_at', '>=', now()->subMonths(6))
        ->groupBy('month')
        ->orderBy('month', 'asc')
        ->get()
        ->toArray();
    }

    protected function getProjectDistribution(): array
    {
        return AcademicProject::select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get()
            ->toArray();
    }

    protected function getStudentActivity(): array
    {
        return Student::select('academic_year_id', DB::raw('count(*) as total_students'))
            ->groupBy('academic_year_id')
            ->with('academicYear:id,name')
            ->get()
            ->map(function ($item) {
                return [
                    'year' => $item->academicYear->name ?? 'Unknown',
                    'total' => $item->total_students
                ];
            })
            ->toArray();
    }
}
