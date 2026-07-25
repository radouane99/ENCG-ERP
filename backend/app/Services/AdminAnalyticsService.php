<?php

namespace App\Services;

use App\Models\AcademicProject;
use App\Models\DocumentRequest;
use App\Models\StudentRegistration;
use App\Models\Student;
use App\Models\Filiere;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminAnalyticsService
{
    /**
     * Get statistics for Document Requests from REAL DB
     */
    public function getDocumentRequestStats(): array
    {
        $total = Schema::hasTable('document_requests') ? DocumentRequest::count() : 0;
        
        $statusBreakdown = Schema::hasTable('document_requests')
            ? DB::table('document_requests')
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->map(fn($item) => ['name' => ucfirst((string)$item->status), 'value' => (int)$item->count])
                ->toArray()
            : [];

        // Strict mode compatible date group
        $monthlyTrend = Schema::hasTable('document_requests')
            ? DB::table('document_requests')
                ->select(
                    DB::raw("DATE_FORMAT(COALESCE(requested_at, created_at), '%Y-%m') as month"),
                    DB::raw('count(*) as count')
                )
                ->whereNotNull(DB::raw("COALESCE(requested_at, created_at)"))
                ->groupBy(DB::raw("DATE_FORMAT(COALESCE(requested_at, created_at), '%Y-%m')"))
                ->orderBy(DB::raw("DATE_FORMAT(COALESCE(requested_at, created_at), '%Y-%m')"), 'asc')
                ->limit(12)
                ->get()
                ->map(fn($item) => ['month' => $item->month, 'count' => (int)$item->count])
                ->toArray()
            : [];

        $pendingCount = Schema::hasTable('document_requests') 
            ? DocumentRequest::whereIn('status', ['pending', 'en_attente', 'submitted', 'draft'])->count()
            : 0;

        return [
            'total' => $total,
            'status_breakdown' => $statusBreakdown,
            'monthly_trend' => $monthlyTrend,
            'pending_count' => $pendingCount,
        ];
    }

    /**
     * Get statistics for Academic Projects from REAL DB
     */
    public function getAcademicProjectStats(): array
    {
        $total = Schema::hasTable('academic_projects') ? AcademicProject::count() : (Schema::hasTable('internships') ? DB::table('internships')->count() : 0);

        $typeDistribution = [];
        if (Schema::hasTable('academic_projects') && AcademicProject::count() > 0) {
            $typeDistribution = DB::table('academic_projects')
                ->select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->get()
                ->map(fn($item) => [
                    'name' => $item->type === 'internship' ? 'Stage' : ($item->type === 'final_project' ? 'PFE' : ucfirst((string)$item->type)), 
                    'value' => (int)$item->count
                ])
                ->toArray();
        } elseif (Schema::hasTable('internships')) {
            $typeDistribution = DB::table('internships')
                ->select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->get()
                ->map(fn($item) => [
                    'name' => ucfirst((string)$item->type),
                    'value' => (int)$item->count
                ])
                ->toArray();
        }

        $completedCount = Schema::hasTable('academic_projects') 
            ? AcademicProject::whereIn('status', ['completed', 'validated', 'approved'])->count() 
            : (Schema::hasTable('internships') ? DB::table('internships')->whereIn('status', ['validated', 'completed'])->count() : 0);

        $activeCount = Schema::hasTable('academic_projects')
            ? AcademicProject::whereIn('status', ['ongoing', 'in_progress', 'pending'])->count()
            : (Schema::hasTable('internships') ? DB::table('internships')->whereIn('status', ['in_progress', 'ongoing', 'submitted'])->count() : 0);
        
        $completionRate = $total > 0 ? round(($completedCount / $total) * 100, 1) : 0;

        return [
            'total' => $total,
            'type_distribution' => $typeDistribution,
            'active_count' => $activeCount,
            'completion_rate' => $completionRate,
        ];
    }

    /**
     * Get statistics for Student Activity & Filière Breakdown from REAL DB
     */
    public function getStudentActivityStats(): array
    {
        $totalActiveStudents = Student::whereNull('deleted_at')->count();

        $filiereBreakdown = [];

        if (Schema::hasTable('student_registrations') && StudentRegistration::count() > 0) {
            $filiereBreakdown = DB::table('student_registrations')
                ->join('filieres', 'student_registrations.filiere_id', '=', 'filieres.id')
                ->select('filieres.name as filiere_name', DB::raw('count(DISTINCT student_registrations.student_id) as student_count'))
                ->groupBy('filieres.id', 'filieres.name')
                ->orderByDesc('student_count')
                ->get()
                ->map(fn($item) => ['name' => $item->filiere_name, 'value' => (int)$item->student_count])
                ->toArray();
        }

        // Fallback: group directly by filieres if filiere_id is on students or student_pathways
        if (empty($filiereBreakdown) && Schema::hasTable('filieres')) {
            $filiereBreakdown = DB::table('filieres')
                ->leftJoin('student_pathways', 'filieres.id', '=', 'student_pathways.filiere_id')
                ->select('filieres.name as filiere_name', DB::raw('count(DISTINCT student_pathways.student_id) as student_count'))
                ->groupBy('filieres.id', 'filieres.name')
                ->orderByDesc('student_count')
                ->get()
                ->map(fn($item) => ['name' => $item->filiere_name, 'value' => (int)$item->student_count])
                ->toArray();
        }

        return [
            'total_active' => $totalActiveStudents,
            'filiere_breakdown' => $filiereBreakdown,
        ];
    }
}
