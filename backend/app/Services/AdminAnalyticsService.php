<?php

namespace App\Services;

use App\Models\AcademicProject;
use App\Models\DocumentRequest;
use App\Models\Filiere;
use App\Models\Internship;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;

class AdminAnalyticsService
{
    /**
     * Statistiques des demandes de documents.
     */
    public function getDocumentRequestStats(): array
    {
        $total = DocumentRequest::count();

        $statusBreakdown = DocumentRequest::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn($item) => ['name' => ucfirst($item->status), 'value' => (int) $item->count])
            ->toArray();

        $monthlyTrend = DocumentRequest::selectRaw("DATE_FORMAT(COALESCE(requested_at, created_at), '%Y-%m') as month, count(*) as count")
            ->whereNotNull('requested_at')
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get()
            ->map(fn($item) => ['month' => $item->month, 'count' => (int) $item->count])
            ->toArray();

        $pendingCount = DocumentRequest::whereIn('status', ['pending', 'en_attente', 'submitted', 'draft'])->count();

        return compact('total', 'statusBreakdown', 'monthlyTrend', 'pendingCount');
    }

    /**
     * Statistiques des projets académiques.
     */
    public function getAcademicProjectStats(): array
    {
        $total = AcademicProject::count() ?: Internship::count();

        $typeDistribution = AcademicProject::selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->get()
            ->map(fn($item) => [
                'name'  => $item->type === 'internship' ? 'Stage' : ($item->type === 'final_project' ? 'PFE' : ucfirst($item->type)),
                'value' => (int) $item->count,
            ])
            ->toArray();

        if (empty($typeDistribution)) {
            $typeDistribution = Internship::selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->get()
                ->map(fn($item) => ['name' => ucfirst($item->type), 'value' => (int) $item->count])
                ->toArray();
        }

        $completedCount = AcademicProject::whereIn('status', ['completed', 'validated', 'approved'])->count()
            ?: Internship::whereIn('status', ['validated', 'completed'])->count();

        $activeCount = AcademicProject::whereIn('status', ['ongoing', 'in_progress', 'pending'])->count()
            ?: Internship::whereIn('status', ['in_progress', 'ongoing', 'submitted'])->count();

        $completionRate = $total > 0 ? round(($completedCount / $total) * 100, 1) : 0;

        return compact('total', 'typeDistribution', 'activeCount', 'completionRate');
    }

    /**
     * Statistiques des étudiants par filière.
     */
    public function getStudentActivityStats(): array
    {
        $totalActiveStudents = Student::count();

        $filiereBreakdown = StudentRegistration::join('filieres', 'student_registrations.filiere_id', '=', 'filieres.id')
            ->selectRaw('filieres.name as filiere_name, count(DISTINCT student_registrations.student_id) as student_count')
            ->groupBy('filieres.id', 'filieres.name')
            ->orderByDesc('student_count')
            ->get()
            ->map(fn($item) => ['name' => $item->filiere_name, 'value' => (int) $item->student_count])
            ->toArray();

        if (empty($filiereBreakdown)) {
            $filiereBreakdown = Filiere::leftJoin('student_pathways', 'filieres.id', '=', 'student_pathways.filiere_id')
                ->selectRaw('filieres.name as filiere_name, count(DISTINCT student_pathways.student_id) as student_count')
                ->groupBy('filieres.id', 'filieres.name')
                ->orderByDesc('student_count')
                ->get()
                ->map(fn($item) => ['name' => $item->filiere_name, 'value' => (int) $item->student_count])
                ->toArray();
        }

        return [
            'total_active'      => $totalActiveStudents,
            'filiere_breakdown' => $filiereBreakdown,
        ];
    }
}