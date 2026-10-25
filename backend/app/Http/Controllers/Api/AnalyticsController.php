<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Services\Analytics\PredictiveAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function __construct(
        private PredictiveAnalyticsService $analyticsService
    ) {}

    /**
     * Étudiants à risque de décrochage.
     */
    public function getAtRiskStudents(Request $request): JsonResponse
    {
        $academicYear = AcademicYear::where('is_current', true)->first();
        if (! $academicYear) {
            return response()->json(['success' => false, 'message' => 'Aucune année académique en cours.'], 404);
        }

        $user = $request->user();
        if (! $user?->institution_id) {
            return response()->json(['success' => false, 'message' => 'Institution non définie.'], 400);
        }

        try {
            $data = $this->analyticsService->getAtRiskStudents($user->institution_id, $academicYear->id);

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Article 14 — Étudiants à risque d'exclusion pour absence (≥2 absences non justifiées).
     * Filtrable par filière et par groupe.
     * ENCG Fès: Règlement pédagogique Art.14 — 2 absences non justifiées => convocation,
     *            3 absences non justifiées => exclusion du module.
     */
    public function getArticle14Risk(Request $request): JsonResponse
    {
        $academicYear = AcademicYear::where('is_current', true)->first();
        if (! $academicYear) {
            return response()->json(['success' => false, 'message' => 'Aucune année académique en cours.'], 404);
        }

        $filiereId = $request->integer('filiere_id') ?: null;
        $groupId   = $request->integer('group_id') ?: null;
        // Art.14 threshold: warn at 2, exclude at 3
        $warnThreshold    = max(1, $request->integer('warn_threshold', 2));
        $excludeThreshold = max(2, $request->integer('exclude_threshold', 3));

        // Query: unexcused absences per student per module, excluding exam period sessions
        $query = DB::table('attendances as a')
            ->join('attendance_sessions as s', 'a.attendance_session_id', '=', 's.id')
            ->join('students as st', 'a.student_id', '=', 'st.id')
            ->join('student_pathways as sp', function ($j) use ($groupId) {
                $j->on('sp.student_id', '=', 'st.id')
                  ->where('sp.is_current', true);
                if ($groupId) {
                    $j->where('sp.group_id', '=', $groupId);
                }
            })
            ->join('groups as g', 'sp.group_id', '=', 'g.id')
            ->join('filieres as f', 'g.filiere_id', '=', 'f.id')
            ->leftJoin('modules as m', 's.module_id', '=', 'm.id')
            ->leftJoin('users as u', 'st.user_id', '=', 'u.id')
            ->where('s.academic_year_id', $academicYear->id)
            ->where('a.status', 'absent')
            ->where('a.is_justified', false)
            // Exclude exam period sessions (Art.14 does not apply during exam weeks)
            ->whereNotExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('exam_sessions as es')
                    ->where('es.is_active', true)
                    ->whereRaw('s.session_date BETWEEN es.start_date AND es.end_date');
            })
            ->whereNotExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('academic_events as ae')
                    ->whereIn('ae.type', ['examens', 'exams', 'exam_normal', 'exam_resit'])
                    ->where('ae.is_active', true)
                    ->whereRaw('s.session_date BETWEEN ae.start_date AND ae.end_date');
            })
            ->select([
                'st.id as student_id',
                'st.student_number',
                'u.first_name',
                'u.last_name',
                'u.email',
                'f.id as filiere_id',
                'f.name as filiere_name',
                'f.code as filiere_code',
                'g.id as group_id',
                'g.name as group_name',
                'm.id as module_id',
                'm.name as module_name',
                'm.code as module_code',
                DB::raw('COUNT(a.id) as unexcused_absences'),
            ])
            ->groupBy(
                'st.id', 'st.student_number', 'u.first_name', 'u.last_name', 'u.email',
                'f.id', 'f.name', 'f.code', 'g.id', 'g.name',
                'm.id', 'm.name', 'm.code'
            )
            ->having('unexcused_absences', '>=', $warnThreshold)
            ->orderByDesc('unexcused_absences');

        if ($filiereId) {
            $query->where('f.id', $filiereId);
        }

        $results = $query->get();

        // Group by student for summary view
        $byStudent = $results->groupBy('student_id')->map(function ($rows) use ($excludeThreshold, $warnThreshold) {
            $first = $rows->first();
            $maxAbsences = $rows->max('unexcused_absences');

            return [
                'student_id'         => $first->student_id,
                'student_number'     => $first->student_number,
                'first_name'         => $first->first_name,
                'last_name'          => $first->last_name,
                'email'              => $first->email,
                'filiere_name'       => $first->filiere_name,
                'filiere_code'       => $first->filiere_code,
                'group_name'         => $first->group_name,
                'modules_at_risk'    => $rows->map(fn ($r) => [
                    'module_id'          => $r->module_id,
                    'module_name'        => $r->module_name,
                    'module_code'        => $r->module_code,
                    'unexcused_absences' => (int) $r->unexcused_absences,
                    'status'             => (int) $r->unexcused_absences >= $excludeThreshold ? 'EXCLUSION_RISK' : 'WARNING',
                ])->values(),
                'max_absences_in_module' => (int) $maxAbsences,
                'art14_status'       => (int) $maxAbsences >= $excludeThreshold ? 'EXCLUSION_RISK' : 'WARNING',
                'requires_convocation' => (int) $maxAbsences >= $warnThreshold,
            ];
        })->values();

        // Summary per filiere
        $byFiliere = $results->groupBy('filiere_id')->map(function ($rows, $fId) use ($excludeThreshold) {
            $first = $rows->first();
            $students = $rows->pluck('student_id')->unique();

            return [
                'filiere_id'        => $fId,
                'filiere_name'      => $first->filiere_name,
                'filiere_code'      => $first->filiere_code,
                'students_at_risk'  => $students->count(),
                'exclusion_risk'    => $rows->where('unexcused_absences', '>=', $excludeThreshold)->pluck('student_id')->unique()->count(),
                'warning'           => $rows->where('unexcused_absences', '<', $excludeThreshold)->pluck('student_id')->unique()->count(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'academic_year'      => $academicYear->name,
                'warn_threshold'     => $warnThreshold,
                'exclude_threshold'  => $excludeThreshold,
                'total_students_at_risk' => $byStudent->count(),
                'exclusion_risk_count'   => $byStudent->where('art14_status', 'EXCLUSION_RISK')->count(),
                'warning_count'          => $byStudent->where('art14_status', 'WARNING')->count(),
                'by_filiere'         => $byFiliere,
                'students'           => $byStudent,
            ],
        ]);
    }

    /**
     * Taux d'absentéisme par filière — pour tableau de bord Scolarité.
     */
    public function getAbsenteeismByFiliere(Request $request): JsonResponse
    {
        $academicYear = AcademicYear::where('is_current', true)->first();
        if (! $academicYear) {
            return response()->json(['success' => false, 'message' => 'Aucune année académique.'], 404);
        }

        $rows = DB::table('attendances as a')
            ->join('attendance_sessions as s', 'a.attendance_session_id', '=', 's.id')
            ->join('student_pathways as sp', function ($j) {
                $j->on('sp.student_id', '=', 'a.student_id')->where('sp.is_current', true);
            })
            ->join('groups as g', 'sp.group_id', '=', 'g.id')
            ->join('filieres as f', 'g.filiere_id', '=', 'f.id')
            ->where('s.academic_year_id', $academicYear->id)
            ->select([
                'f.id as filiere_id',
                'f.name as filiere_name',
                'f.code as filiere_code',
                DB::raw('COUNT(a.id) as total_records'),
                DB::raw("SUM(CASE WHEN a.status = 'absent' AND a.is_justified = 0 THEN 1 ELSE 0 END) as unexcused_absences"),
                DB::raw("SUM(CASE WHEN a.status = 'absent' AND a.is_justified = 1 THEN 1 ELSE 0 END) as justified_absences"),
                DB::raw("SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as presences"),
            ])
            ->groupBy('f.id', 'f.name', 'f.code')
            ->orderBy('f.code')
            ->get()
            ->map(function ($row) {
                $total = (int) $row->total_records;
                $absRate = $total > 0 ? round((($row->unexcused_absences + $row->justified_absences) / $total) * 100, 1) : 0;
                $unexcusedRate = $total > 0 ? round(($row->unexcused_absences / $total) * 100, 1) : 0;

                return [
                    'filiere_id'          => $row->filiere_id,
                    'filiere_name'        => $row->filiere_name,
                    'filiere_code'        => $row->filiere_code,
                    'total_records'       => $total,
                    'presences'           => (int) $row->presences,
                    'unexcused_absences'  => (int) $row->unexcused_absences,
                    'justified_absences'  => (int) $row->justified_absences,
                    'absenteeism_rate'    => $absRate,
                    'unexcused_rate'      => $unexcusedRate,
                    'attendance_rate'     => $total > 0 ? round(($row->presences / $total) * 100, 1) : 100,
                    'risk_level'          => $unexcusedRate >= 15 ? 'HIGH' : ($unexcusedRate >= 8 ? 'MEDIUM' : 'LOW'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'academic_year' => $academicYear->name,
                'filieres'      => $rows,
                'summary'       => [
                    'total_filieres'   => $rows->count(),
                    'high_risk'        => $rows->where('risk_level', 'HIGH')->count(),
                    'average_rate'     => $rows->avg('absenteeism_rate') ? round($rows->avg('absenteeism_rate'), 1) : 0,
                ],
            ],
        ]);
    }
}

