<?php

namespace App\Services;

use App\Models\AcademicProject;
use App\Models\DocumentRequest;
use App\Models\StudentRegistration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsService
{
    /**
     * Cache duration in seconds (10 minutes)
     */
    private const CACHE_TTL = 600;

    /**
     * Get statistics for Document Requests
     */
    public function getDocumentRequestStats(): array
    {
        return Cache::remember('admin.analytics.document_requests', self::CACHE_TTL, function () {
            $total = DocumentRequest::count();
            
            $statusBreakdown = DocumentRequest::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->map(fn($item) => ['name' => ucfirst((string)$item->status), 'value' => $item->count])
                ->toArray();

            $monthlyTrend = DocumentRequest::select(
                DB::raw("DATE_FORMAT(requested_at, '%Y-%m') as month"),
                DB::raw('count(*) as count')
            )
            ->whereNotNull('requested_at')
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->limit(12)
            ->get()
            ->toArray();

            return [
                'total' => $total,
                'status_breakdown' => $statusBreakdown,
                'monthly_trend' => $monthlyTrend,
                'pending_count' => collect($statusBreakdown)->firstWhere('name', 'Pending')['value'] ?? collect($statusBreakdown)->firstWhere('name', 'pending')['value'] ?? 0,
            ];
        });
    }

    /**
     * Get statistics for Academic Projects (Internships & PFEs)
     */
    public function getAcademicProjectStats(): array
    {
        return Cache::remember('admin.analytics.academic_projects', self::CACHE_TTL, function () {
            $total = AcademicProject::count();

            $typeDistribution = AcademicProject::select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->get()
                ->map(fn($item) => [
                    'name' => $item->type === 'internship' ? 'Stage' : ($item->type === 'final_project' ? 'PFE' : ucfirst((string)$item->type)), 
                    'value' => $item->count
                ])
                ->toArray();

            $completedCount = AcademicProject::whereIn('status', ['completed', 'validated', 'approved'])->count();
            $activeCount = AcademicProject::whereIn('status', ['ongoing', 'in_progress', 'pending'])->count();
            
            $completionRate = $total > 0 ? round(($completedCount / $total) * 100, 2) : 0;

            return [
                'total' => $total,
                'type_distribution' => $typeDistribution,
                'active_count' => $activeCount,
                'completion_rate' => $completionRate,
            ];
        });
    }

    /**
     * Get statistics for Student Registrations grouped by Filiere
     */
    public function getStudentActivityStats(): array
    {
        return Cache::remember('admin.analytics.student_activity', self::CACHE_TTL, function () {
            // Get latest active registrations grouped by filiere
            $filiereBreakdown = StudentRegistration::join('filieres', 'student_registrations.filiere_id', '=', 'filieres.id')
                ->select('filieres.name as filiere_name', DB::raw('count(*) as student_count'))
                ->whereIn('student_registrations.status', ['active', 'registered', 'validated', 'enrolled'])
                ->groupBy('filieres.id', 'filieres.name')
                ->orderByDesc('student_count')
                ->get()
                ->map(fn($item) => ['name' => $item->filiere_name, 'value' => $item->student_count])
                ->toArray();

            $totalActiveStudents = array_sum(array_column($filiereBreakdown, 'value'));

            return [
                'total_active' => $totalActiveStudents,
                'filiere_breakdown' => $filiereBreakdown,
            ];
        });
    }
}
