<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicProject;
use App\Models\ResearchPublication;
use App\Models\VacationContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CedocController extends Controller
{
    /**
     * Tableau de bord CEDOC pour l'étudiant connecté.
     */
    public function getDashboardStats(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Étudiant authentifié requis.'], 401);
        }

        $publications = ResearchPublication::where('student_id', $student->id)->get();

        $vacations = collect();
        $authUser  = $request->user();

        if ($authUser?->professor) {
            $vacations = VacationContract::where('professor_id', $authUser->professor->id)
                ->limit(2)
                ->get()
                ->map(fn($vac) => [
                    'id'     => $vac->id,
                    'module' => $vac->module_name ?? null,
                    'hours'  => $vac->agreed_hours ?? null,
                    'date'   => $vac->contract_start ?? null,
                    'status' => $vac->status ?? null,
                ]);
        }

        $thesis = AcademicProject::where('student_id', $student->id)
            ->where('type', 'phd_thesis')
            ->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'publications' => $publications,
                'vacations'    => $vacations,
                'thesis'       => $thesis ? [
                    'title'    => $thesis->title,
                    'director' => $thesis->supervisor_name,
                    'year'     => $thesis->year ?? null,
                    'progress' => $thesis->status === 'completed' ? 100 : null,
                ] : null,
                'training' => [
                    'completed_hours' => null,
                    'required_hours'  => null,
                ],
            ],
        ]);
    }
}