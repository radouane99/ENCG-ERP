<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\Student;
use App\Models\Professor;
use App\Models\Module;
use App\Models\Filiere;
use App\Models\VacationContract;
use App\Models\AttendanceSession;
use App\Models\AttendanceRecord;

class DashboardController extends Controller
{
    /**
     * Get real statistics for the Administration Dashboard.
     */
    public function getAdminStats(Request $request): JsonResponse
    {
        // ── Students ─────────────────────────────────────────────────
        $totalStudents  = Student::count();
        $activeStudents = Student::where('status', 'active')->count();
        $newThisMonth   = Student::whereMonth('created_at', now()->month)
                                 ->whereYear('created_at', now()->year)->count();

        // ── Professors ───────────────────────────────────────────────
        $totalProfessors     = Professor::count();
        $activeProfessors    = Professor::where('is_active', true)->count();
        $permanentProfessors = Professor::where('contract_type', 'permanent')->count();

        // ── Vacataires ───────────────────────────────────────────────
        $totalVacataires   = VacationContract::count();
        $pendingVacataires = VacationContract::where('status', 'pending')->count();
        $totalVacHours     = VacationContract::sum('agreed_hours');

        // ── Academic Structure ────────────────────────────────────────
        $totalModules  = Module::count();
        $totalFilieres = Filiere::where('is_active', true)->count();

        // ── Enrollment by Month (last 6 months) ──────────────────────
        $enrollmentByMonth = Student::select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('YEAR(created_at) as year'),
                DB::raw('COUNT(*) as students')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'name' => date('M', mktime(0, 0, 0, (int)$row->month, 1)),
                'students' => (int)$row->students
            ]);

        // Fill missing months with 0
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthName = $date->format('M');
            $existing = $enrollmentByMonth->firstWhere('name', $monthName);
            $months->push(['name' => $monthName, 'students' => $existing ? $existing['students'] : 0]);
        }

        // ── Students by Filière ───────────────────────────────────────
        $studentsByFiliere = DB::table('filieres')
            ->leftJoin('student_pathways', 'filieres.id', '=', 'student_pathways.filiere_id')
            ->select('filieres.code as name', DB::raw('COUNT(student_pathways.id) as count'))
            ->where('filieres.is_active', true)
            ->groupBy('filieres.id', 'filieres.code')
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'count' => (int)$row->count]);

        // ── Attendance Rate ───────────────────────────────────────────
        $totalRecords   = AttendanceRecord::count();
        $presentRecords = AttendanceRecord::where('status', 'present')->count();
        $attendanceRate = $totalRecords > 0
            ? round(($presentRecords / $totalRecords) * 100, 1)
            : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'students' => [
                    'total'          => $totalStudents,
                    'active'         => $activeStudents,
                    'new_this_month' => $newThisMonth,
                    'graduated'      => Student::where('status', 'graduated')->count(),
                    'suspended'      => Student::where('status', 'suspended')->count(),
                ],
                'professors' => [
                    'total'          => $totalProfessors,
                    'active'         => $activeProfessors,
                    'permanent'      => $permanentProfessors,
                    'contractual'    => Professor::where('contract_type', 'contractual')->count(),
                ],
                'vacataires' => [
                    'total'         => $totalVacataires,
                    'pending'       => $pendingVacataires,
                    'total_hours'   => $totalVacHours,
                ],
                'academic' => [
                    'total_modules'  => $totalModules,
                    'total_filieres' => $totalFilieres,
                ],
                'attendance_rate'   => $attendanceRate,
                'enrollment_chart'  => $months->values(),
                'filiere_chart'     => $studentsByFiliere->values(),
            ]
        ]);
    }

    /**
     * Get real statistics for the Executive Director Dashboard.
     */
    public function getExecutiveStats(Request $request): JsonResponse
    {
        $totalStudents  = Student::count();
        $totalProfessors = Professor::count();
        $totalFilieres  = Filiere::where('is_active', true)->count();

        // Vacataire expenses from contracts
        $vacationExpenses = VacationContract::where('status', 'signed')
            ->get()
            ->sum(fn ($c) => $c->agreed_hours * $c->hourly_rate);

        // Top performing filieres (by student count as proxy)
        $topFilieres = DB::table('filieres')
            ->leftJoin('student_pathways', 'filieres.id', '=', 'student_pathways.filiere_id')
            ->select('filieres.code as name', DB::raw('COUNT(student_pathways.id) as count'))
            ->where('filieres.is_active', true)
            ->groupBy('filieres.id', 'filieres.code')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'total_students'   => $totalStudents,
                    'total_professors' => $totalProfessors,
                    'total_filieres'   => $totalFilieres,
                    'total_modules'    => Module::count(),
                ],
                'financials' => [
                    'vacation_expenses'     => $vacationExpenses,
                    'pending_vacataires'    => VacationContract::where('status', 'pending')->count(),
                ],
                'top_filieres' => $topFilieres,
            ]
        ]);
    }

    public function getStudentStats(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'gpa'                 => 0, // Computed when grades exist
                'attendance'          => 0,
                'upcoming_exams'      => 0,
                'pending_assignments' => 0
            ]
        ]);
    }

    public function getProfessorStats(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => Student::where('status', 'active')->count(),
                'total_modules'  => Module::count(),
                'pending_grades' => 0,
                'next_class'     => null
            ]
        ]);
    }
}
