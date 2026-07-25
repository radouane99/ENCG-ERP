<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\CourseEvaluation;
use App\Models\EvaluationCampaign;
use App\Models\Module;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AdminCourseEvaluationController extends Controller
{
    /**
     * Get aggregated course evaluation metrics and comments directly from database.
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            // Check if the tables exist first
            if (!\Illuminate\Support\Facades\Schema::hasTable('evaluation_campaigns')) {
                return response()->json([
                    'success' => true,
                    'campaign' => ['id' => 1, 'name' => 'Campagne d\'Évaluation S5-S6 ENCG Fès', 'status' => 'OPEN', 'semester_number' => 5],
                    'stats' => ['total_evaluations' => 0, 'global_average' => 0.00, 'participation_rate' => '0%'],
                    'evaluations' => [],
                    'comments' => [],
                    '_note' => 'Tables non encore créées. Lancez: php artisan migrate'
                ]);
            }

            // Fetch or create active campaign
            $campaign = EvaluationCampaign::firstOrCreate(['id' => 1], [
                'name' => 'Campagne d\'Évaluation S5-S6 ENCG Fès',
                'status' => 'OPEN',
                'semester_number' => 5
            ]);

            // Fetch real database evaluations grouped by module
            $rawEvaluations = DB::table('course_evaluations')
                ->join('modules', 'course_evaluations.module_id', '=', 'modules.id')
                ->leftJoin('users', 'course_evaluations.professor_id', '=', 'users.id')
                ->leftJoin('filieres', 'modules.filiere_id', '=', 'filieres.id')
                ->select(
                    'modules.id as module_id',
                    'modules.code as module_code',
                    'modules.name as module_name',
                    DB::raw("COALESCE(users.name, 'Pr. Enseignant') as professor_name"),
                    'filieres.name as filiere_name',
                    DB::raw("COUNT(course_evaluations.id) as count"),
                    DB::raw("ROUND(AVG(course_evaluations.q1_organisation)::numeric, 2) as q1"),
                    DB::raw("ROUND(AVG(course_evaluations.q2_clarte)::numeric, 2) as q2"),
                    DB::raw("ROUND(AVG(course_evaluations.q3_dispo)::numeric, 2) as q3"),
                    DB::raw("ROUND(AVG(course_evaluations.q4_utilite)::numeric, 2) as q4"),
                    DB::raw("ROUND(AVG((q1_organisation + q2_clarte + q3_dispo + q4_utilite) / 4.0)::numeric, 2) as score")
                )
                ->groupBy('modules.id', 'modules.code', 'modules.name', 'users.name', 'filieres.name')
                ->get();

            // Fetch qualitative comments from DB
            $comments = DB::table('course_evaluations')
                ->join('modules', 'course_evaluations.module_id', '=', 'modules.id')
                ->leftJoin('users', 'course_evaluations.professor_id', '=', 'users.id')
                ->whereNotNull('course_evaluations.comment')
                ->where('course_evaluations.comment', '!=', '')
                ->orderBy('course_evaluations.created_at', 'desc')
                ->limit(10)
                ->select(
                    'course_evaluations.id',
                    'modules.name as module_name',
                    DB::raw("COALESCE(users.name, 'Pr. Enseignant') as professor_name"),
                    'course_evaluations.comment',
                    'course_evaluations.created_at'
                )
                ->get();

            $totalEvaluations = DB::table('course_evaluations')->count();
            $uniqueStudentsEvaluated = DB::table('course_evaluations')->distinct('student_id')->count('student_id');
            $totalRegisteredStudents = DB::table('student_registrations')->distinct('student_id')->count('student_id');
            $participationRate = $totalRegisteredStudents > 0
                ? round(($uniqueStudentsEvaluated / $totalRegisteredStudents) * 100, 1) . '%'
                : '0%';

            $globalAverage = DB::table('course_evaluations')
                ->select(DB::raw("ROUND(AVG((q1_organisation + q2_clarte + q3_dispo + q4_utilite) / 4.0)::numeric, 2) as avg_score"))
                ->value('avg_score') ?? 0.00;

            return response()->json([
                'success' => true,
                'campaign' => [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'status' => $campaign->status,
                    'semester_number' => $campaign->semester_number,
                ],
                'stats' => [
                    'total_evaluations' => $totalEvaluations,
                    'global_average' => (float)$globalAverage,
                    'participation_rate' => $participationRate,
                ],
                'evaluations' => $rawEvaluations,
                'comments' => $comments
            ]);

        } catch (\Exception $e) {
            // Graceful fallback: return empty safe state if any DB error
            return response()->json([
                'success' => true,
                'campaign' => ['id' => 1, 'name' => 'Campagne d\'Évaluation S5-S6 ENCG Fès', 'status' => 'OPEN', 'semester_number' => 5],
                'stats' => ['total_evaluations' => 0, 'global_average' => 0.00, 'participation_rate' => '0%'],
                'evaluations' => [],
                'comments' => [],
                '_error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Toggle campaign status (OPEN / CLOSED) in database.
     */
    public function toggleCampaign(Request $request): JsonResponse
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('evaluation_campaigns')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Table non créée. Lancez: docker exec encg_backend php artisan migrate'
                ], 500);
            }

            $campaign = EvaluationCampaign::firstOrCreate(['id' => 1]);
            $newStatus = $campaign->status === 'OPEN' ? 'CLOSED' : 'OPEN';
            $campaign->update(['status' => $newStatus]);

            return response()->json([
                'success' => true,
                'status' => $newStatus,
                'message' => $newStatus === 'OPEN' ? 'La campagne d\'évaluation est désormais OUVERTE.' : 'La campagne d\'évaluation a été CLÔTURÉE.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
