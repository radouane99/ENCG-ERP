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
        // Require an authenticated student
        $student = $request->user()?->student;
        if (! $student) {
            return response()->json([
                'success' => false,
                'message' => 'Authenticated student required'
            ], 401);
        }
        $studentId = $student->id;

        $publications = DB::table('research_publications')
            ->where('student_id', $studentId)
            ->get();

        // If the authenticated user is a professor, fetch their vacation contracts; otherwise do not expose vacataire data
        $authUser = $request->user();
        $vacations = collect();

        if ($authUser && method_exists($authUser, 'professor') && $authUser->professor) {
            $professorId = $authUser->professor->id;
            $vacations = DB::table('vacation_contracts')
                ->where('professor_id', $professorId)
                ->limit(2)
                ->get()->map(function($vac) {
                    return [
                        'id' => $vac->id,
                        'module' => $vac->module_name ?? null,
                        'hours' => $vac->agreed_hours ?? null,
                        'date' => $vac->contract_start ?? null,
                        'status' => $vac->status ?? null
                    ];
                });
        } else {
            $vacations = collect();
        }

        $thesis = DB::table('academic_projects')
            ->where('student_id', $studentId)
            ->where('type', 'phd_thesis')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'publications' => $publications,
                'vacations' => $vacations,
                'thesis' => $thesis ? [
                    'title' => $thesis->title,
                    'director' => $thesis->supervisor_name,
                    'year' => $thesis->year ?? null,
                    'progress' => $thesis->status === 'completed' ? 100 : null,
                    'next_deadline' => $thesis->next_deadline ?? null,
                ] : null,
                'training' => [
                    'completed_hours' => null,
                    'required_hours' => null
                ]
            ]
        ]);
    }
}
