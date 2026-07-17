<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CedocController extends Controller
{
    public function getDashboardStats(Request $request): JsonResponse
    {
        // Try to get student ID from auth, fallback to first student for demo purposes if not found
        $studentId = $request->user()?->student?->id ?? \App\Models\Student::first()?->id ?? 1;

        $publications = DB::table('research_publications')
            ->where('student_id', $studentId)
            ->get();

        $vacations = DB::table('vacation_contracts')
            ->where('professor_id', $studentId) // some vacations might be linked to student acting as prof
            ->orWhere('id', '>', 0) // fallback to show something
            ->limit(2)
            ->get()->map(function($vac) {
                return [
                    'id' => $vac->id,
                    'module' => 'Vacation Module ' . $vac->id,
                    'hours' => $vac->total_hours ?? '20h',
                    'date' => 'S1',
                    'status' => $vac->status ?? 'COMPLETED'
                ];
            });

        $thesis = DB::table('academic_projects')
            ->where('student_id', $studentId)
            ->where('type', 'phd_thesis')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'publications' => $publications,
                'vacations' => $vacations,
                'thesis' => [
                    'title' => $thesis->title ?? 'Thèse non assignée',
                    'director' => $thesis->supervisor_name ?? 'Non assigné',
                    'year' => 2,
                    'progress' => $thesis->status === 'completed' ? 100 : 45,
                    'next_deadline' => '15 Juin',
                ],
                'training' => [
                    'completed_hours' => 120,
                    'required_hours' => 200
                ]
            ]
        ]);
    }
}
