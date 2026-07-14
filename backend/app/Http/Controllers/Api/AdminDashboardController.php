<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Student;
use App\Models\User;
use App\Models\AttendanceRecord;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Get statistics for the Admin Dashboard.
     */
    public function getStats(Request $request): JsonResponse
    {
        // Total active students
        $studentsCount = DB::table('students')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->where('users.is_active', true)
            ->count();

        // Total professors (permanents and vacataires)
        $professorsCount = User::whereHas('roles', function($q) {
            $q->whereIn('name', ['professor', 'vacataire']);
        })->where('is_active', true)->count();

        $permanentsCount = User::whereHas('roles', function($q) {
            $q->where('name', 'professor');
        })->where('is_active', true)->count();
        
        $vacatairesCount = User::whereHas('roles', function($q) {
            $q->where('name', 'vacataire');
        })->where('is_active', true)->count();

        // Real attendance rate from actual records
        $totalRecords   = AttendanceRecord::count();
        $presentRecords = AttendanceRecord::where('status', 'present')->count();
        $attendanceRate = $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : null;

        // Alerts (e.g. pending documents, pending justifications)
        $alertsCount = DB::table('document_requests')->where('status', 'pending')->count()
                     + DB::table('absence_justifications')->where('status', 'pending')->count();

        // Filiere distribution
        $filieres = DB::table('filieres')->select('id', 'code', 'name')->get();
        $filiereDistribution = [];
        $colors = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899'];
        $totalFiliereStudents = 0;
        
        foreach ($filieres as $index => $filiere) {
            $count = DB::table('student_pathways')
                ->where('filiere_id', $filiere->id)
                ->where('is_current', true)
                ->count();
                
            $filiereDistribution[] = [
                'name' => $filiere->code,
                'count' => $count,
                'color' => $colors[$index % count($colors)]
            ];
            $totalFiliereStudents += $count;
        }

        // Calculate percentages
        if ($totalFiliereStudents > 0) {
            foreach ($filiereDistribution as &$fd) {
                $fd['value'] = round(($fd['count'] / $totalFiliereStudents) * 100);
            }
        } else {
            $filiereDistribution = [];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'studentsCount' => $studentsCount,
                'professorsCount' => $professorsCount,
                'permanentsCount' => $permanentsCount,
                'vacatairesCount' => $vacatairesCount,
                'attendanceRate' => $attendanceRate,
                'alertsCount' => $alertsCount,
                'filiereDistribution' => $filiereDistribution
            ]
        ]);
    }
}
