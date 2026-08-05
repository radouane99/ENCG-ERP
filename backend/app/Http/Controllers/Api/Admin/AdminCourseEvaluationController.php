<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseEvaluation;
use App\Models\EvaluationCampaign;
use App\Models\StudentRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCourseEvaluationController extends Controller
{
    /**
     * Statistiques des évaluations de cours.
     */
    public function getStats(Request $request): JsonResponse
    {
        $campaign = EvaluationCampaign::firstOrCreate(['id' => 1], [
            'name'            => 'Campagne d\'Évaluation S5-S6 ENCG Fès',
            'status'          => 'OPEN',
            'semester_number' => 5,
        ]);

        $evaluations = CourseEvaluation::with(['module.filiere', 'professor'])
            ->get()
            ->groupBy('module_id')
            ->map(function ($group) {
                $first = $group->first();
                return [
                    'module_id'      => $first->module_id,
                    'module_code'    => $first->module->code ?? 'N/A',
                    'module_name'    => $first->module->name ?? 'N/A',
                    'professor_name' => $first->professor->name ?? 'Pr. Enseignant',
                    'filiere_name'   => $first->module->filiere->name ?? 'N/A',
                    'count'          => $group->count(),
                    'q1'             => round($group->avg('q1_organisation'), 2),
                    'q2'             => round($group->avg('q2_clarte'), 2),
                    'q3'             => round($group->avg('q3_dispo'), 2),
                    'q4'             => round($group->avg('q4_utilite'), 2),
                    'score'          => round($group->avg(function ($e) {
                        return ($e->q1_organisation + $e->q2_clarte + $e->q3_dispo + $e->q4_utilite) / 4;
                    }), 2),
                ];
            })->values();

        $comments = CourseEvaluation::with(['module', 'professor'])
            ->whereNotNull('comment')
            ->where('comment', '!=', '')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($e) => [
                'id'             => $e->id,
                'module_name'    => $e->module->name ?? 'N/A',
                'professor_name' => $e->professor->name ?? 'Pr. Enseignant',
                'comment'        => $e->comment,
                'created_at'     => $e->created_at,
            ]);

        $totalEvaluations   = CourseEvaluation::count();
        $uniqueStudents     = CourseEvaluation::distinct('student_id')->count('student_id');
        $totalStudents      = StudentRegistration::distinct('student_id')->count('student_id');
        $participationRate  = $totalStudents > 0 ? round(($uniqueStudents / $totalStudents) * 100, 1) . '%' : '0%';

        $globalAverage = round(CourseEvaluation::selectRaw('AVG((q1_organisation + q2_clarte + q3_dispo + q4_utilite) / 4) as avg')->value('avg') ?? 0, 2);

        return response()->json([
            'success'     => true,
            'campaign'    => [
                'id'              => $campaign->id,
                'name'            => $campaign->name,
                'status'          => $campaign->status,
                'semester_number' => $campaign->semester_number,
            ],
            'stats'       => [
                'total_evaluations'  => $totalEvaluations,
                'global_average'     => (float) $globalAverage,
                'participation_rate' => $participationRate,
            ],
            'evaluations' => $evaluations,
            'comments'    => $comments,
        ]);
    }

    /**
     * Basculer l'état de la campagne (OUVERT/FERMÉ).
     */
    public function toggleCampaign(Request $request): JsonResponse
    {
        $campaign  = EvaluationCampaign::firstOrCreate(['id' => 1]);
        $newStatus = $campaign->status === 'OPEN' ? 'CLOSED' : 'OPEN';
        $campaign->update(['status' => $newStatus]);

        return response()->json([
            'success' => true,
            'status'  => $newStatus,
            'message' => $newStatus === 'OPEN'
                ? 'La campagne d\'évaluation est désormais OUVERTE.'
                : 'La campagne d\'évaluation a été CLÔTURÉE.',
        ]);
    }
}