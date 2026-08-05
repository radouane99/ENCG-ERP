<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Department;
use App\Models\Exam;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\Grade;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminExamController extends Controller
{
    /**
     * Liste des examens avec statistiques.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Exam::with(['module', 'group', 'room', 'surveillances.professor'])
            ->withCount(['seatings', 'incidents'])
            ->latest();

        if ($request->filled('filiere_id')) {
            $query->whereHas('module', fn($q) => $q->where('filiere_id', (int) $request->filiere_id));
        }

        if ($request->filled('session_id')) {
            $query->where('exam_session_id', (int) $request->session_id);
        }

        if ($request->filled('semester_number')) {
            $query->whereHas('module', fn($q) => $q->where('semester_number', (int) $request->semester_number));
        }

        $exams = $query->get()->map(function ($exam) {
            $generatedCount = $exam->seatings_count;
            $presentsCount  = ExamSeating::where('exam_id', $exam->id)->where('is_present', true)->count();
            $sentCount      = ExamSeating::where('exam_id', $exam->id)->whereNotNull('sent_at')->count();
            $incidentsCount = $exam->incidents_count;

            $surveillantsText = $exam->surveillances->map(function ($s) {
                $prof = $s->professor;
                return $prof ? ($prof->name ?? $prof->first_name . ' ' . $prof->last_name) : 'Inconnu';
            })->join(', ') ?: 'Aucun';

            return [
                'id'                => $exam->id,
                'session_id'        => $exam->exam_session_id,
                'exam_session_id'   => $exam->exam_session_id,
                'module'            => $exam->module,
                'group'             => $exam->group,
                'room'              => $exam->room,
                'exam_date'         => $exam->exam_date,
                'start_time'        => $exam->start_time,
                'duration_minutes'  => $exam->duration_minutes,
                'type'              => $exam->session_type ?? 'EXAMEN',
                'surveillants'      => $surveillantsText,
                'generated_count'   => $generatedCount,
                'presents_count'    => $presentsCount,
                'absents_count'     => max(0, $generatedCount - $presentsCount),
                'incidents_count'   => $incidentsCount,
                'is_locked'         => (bool) $exam->is_locked,
                'locked_at'         => $exam->locked_at,
                'sent_count'        => $sentCount,
                'pending_count'     => max(0, $generatedCount - $sentCount),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $exams,
        ]);
    }

    /**
     * Analytiques des examens.
     */
    public function analytics(): JsonResponse
    {
        $totalGrades   = Grade::count();
        $presentGrades = Grade::where('absent', false)->count();
        $passingGrades = Grade::where('absent', false)->where('value', '>=', 10)->count();

        $attendanceRate = $totalGrades > 0 ? round(($presentGrades / $totalGrades) * 100, 1) : 0;
        $successRate    = $presentGrades > 0 ? round(($passingGrades / $presentGrades) * 100, 1) : 0;
        $overallAverage = round(Grade::where('absent', false)->avg('value') ?? 0, 2);
        $scheduledExams = Assessment::count();

        // Données par département (S6 vs S7)
        $departments = Department::with(['filieres.modules.assessments.grades' => fn($q) => $q->where('absent', false)])->get();

        $chartData = [];
        foreach ($departments as $dept) {
            $s6Sum = 0; $s6Count = 0;
            $s7Sum = 0; $s7Count = 0;

            foreach ($dept->filieres as $filiere) {
                foreach ($filiere->modules as $module) {
                    if (!in_array($module->semester_number, [6, 7])) continue;

                    foreach ($module->assessments as $assessment) {
                        foreach ($assessment->grades as $grade) {
                            if ($module->semester_number == 6) {
                                $s6Sum += $grade->value;
                                $s6Count++;
                            } else {
                                $s7Sum += $grade->value;
                                $s7Count++;
                            }
                        }
                    }
                }
            }

            $chartData[] = [
                'name' => $dept->name,
                's6'   => $s6Count > 0 ? round(($s6Sum / $s6Count) * 5, 1) : 0,
                's7'   => $s7Count > 0 ? round(($s7Sum / $s7Count) * 5, 1) : 0,
            ];
        }

        // Modules critiques (taux d'échec > 40%)
        $modules = Module::with(['filiere', 'assessments.grades'])->get();
        $criticalModules = [];

        foreach ($modules as $module) {
            $mTotal = 0;
            $mFail  = 0;

            foreach ($module->assessments as $assessment) {
                foreach ($assessment->grades as $grade) {
                    $mTotal++;
                    if ($grade->absent || $grade->value < 10) {
                        $mFail++;
                    }
                }
            }

            if ($mTotal > 0) {
                $failRate = round(($mFail / $mTotal) * 100, 1);
                if ($failRate > 40) {
                    $criticalModules[] = [
                        'id'           => $module->id,
                        'name'         => $module->name,
                        'failure_rate' => $failRate,
                        'context'      => ($module->filiere->name ?? 'N/A') . ' — S' . $module->semester_number,
                    ];
                }
            }
        }

        usort($criticalModules, fn($a, $b) => $b['failure_rate'] <=> $a['failure_rate']);
        $criticalModules = array_slice($criticalModules, 0, 5);

        return response()->json([
            'success' => true,
            'data'    => [
                'stats'            => compact('successRate', 'attendanceRate', 'overallAverage', 'scheduledExams'),
                'chart'            => $chartData,
                'critical_modules' => $criticalModules,
            ],
        ]);
    }
}