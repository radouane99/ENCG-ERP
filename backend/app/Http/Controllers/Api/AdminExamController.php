<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Department;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Professor;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminExamController extends Controller
{
    /**
     * Liste des examens avec statistiques.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Exam::with([
            'module.filiere',
            'group.filiere',
            'room',
            'surveillances.professor.user',
            'seatings' => fn ($q) => $q->select('id', 'exam_id', 'student_id', 'sent_at', 'is_present'),
        ])
            ->withCount(['seatings', 'incidents'])
            ->latest();

        if ($request->filled('filiere_id')) {
            $query->whereHas('module', fn ($q) => $q->where('filiere_id', (int) $request->filiere_id));
        }

        if ($request->filled('session_id')) {
            $query->where('exam_session_id', (int) $request->session_id);
        }

        if ($request->filled('semester_number')) {
            $query->whereHas('module', fn ($q) => $q->where('semester_number', (int) $request->semester_number));
        }

        $exams = $query->get()->map(function ($exam) {
            $studentIds = $exam->seatings->pluck('student_id')->filter()->unique()->values()->all();
            $sentStudentIds = $exam->seatings->whereNotNull('sent_at')->pluck('student_id')->filter()->unique()->values()->all();
            $generatedCount = count($studentIds) > 0 ? count($studentIds) : (int) $exam->seatings_count;
            $presentsCount = $exam->seatings->where('is_present', true)->count();
            $sentCount = count($sentStudentIds);
            $incidentsCount = (int) $exam->incidents_count;

            $surveillantsText = $exam->surveillances->map(function ($s) {
                if ($s->professor) {
                    $prof = $s->professor;
                    $user = $prof->user;
                    $name = $user ? trim(($user->first_name ?? '').' '.($user->last_name ?? '')) ?: $user->name : null;
                    if ($name) {
                        return $name;
                    }
                    $profName = trim(($prof->first_name ?? '').' '.($prof->last_name ?? '')) ?: ($prof->name ?? null);
                    if ($profName) {
                        return $profName;
                    }
                }

                if ($s->professor_id) {
                    $user = User::find($s->professor_id);
                    if ($user) {
                        $name = trim(($user->first_name ?? '').' '.($user->last_name ?? '')) ?: $user->name;
                        if ($name) {
                            return $name;
                        }
                    }

                    $prof = Professor::with('user')->find($s->professor_id);
                    if ($prof) {
                        $name = $prof->user ? trim(($prof->user->first_name ?? '').' '.($prof->user->last_name ?? '')) ?: $prof->user->name : null;
                        if ($name) {
                            return $name;
                        }
                        $profName = trim(($prof->first_name ?? '').' '.($prof->last_name ?? '')) ?: ($prof->name ?? null);
                        if ($profName) {
                            return $profName;
                        }
                    }
                }

                return null;
            })->filter(fn ($n) => ! empty($n) && strtolower($n) !== 'inconnu')->join(', ') ?: 'À affecter';

            return [
                'id' => $exam->id,
                'session_id' => $exam->exam_session_id,
                'exam_session_id' => $exam->exam_session_id,
                'module' => $exam->module,
                'group' => $exam->group,
                'room' => $exam->room,
                'exam_date' => $exam->exam_date,
                'start_time' => $exam->start_time,
                'duration_minutes' => $exam->duration_minutes,
                'type' => $exam->session_type ?? 'EXAMEN',
                'surveillants' => $surveillantsText,
                'student_ids' => $studentIds,
                'sent_student_ids' => $sentStudentIds,
                'unique_students_count' => count($studentIds),
                'generated_count' => $generatedCount,
                'presents_count' => $presentsCount,
                'absents_count' => max(0, $generatedCount - $presentsCount),
                'incidents_count' => $incidentsCount,
                'is_locked' => (bool) $exam->is_locked,
                'locked_at' => $exam->locked_at,
                'sent_count' => $sentCount,
                'pending_count' => max(0, $generatedCount - $sentCount),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $exams,
        ]);
    }

    /**
     * Analytiques des examens.
     */
    public function analytics(): JsonResponse
    {
        $totalGrades = Grade::count();
        $presentGrades = Grade::where('absent', false)->count();
        $passingGrades = Grade::where('absent', false)->where('value', '>=', 10)->count();

        $attendanceRate = $totalGrades > 0 ? round(($presentGrades / $totalGrades) * 100, 1) : 0;
        $successRate = $presentGrades > 0 ? round(($passingGrades / $presentGrades) * 100, 1) : 0;
        $overallAverage = round(Grade::where('absent', false)->avg('value') ?? 0, 2);
        $scheduledExams = Assessment::count();

        // Données par département (S6 vs S7)
        $departments = Department::with(['filieres.modules.assessments.grades' => fn ($q) => $q->where('absent', false)])->get();

        $chartData = [];
        foreach ($departments as $dept) {
            $s6Sum = 0;
            $s6Count = 0;
            $s7Sum = 0;
            $s7Count = 0;

            foreach ($dept->filieres as $filiere) {
                foreach ($filiere->modules as $module) {
                    if (! in_array($module->semester_number, [6, 7])) {
                        continue;
                    }

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
                's6' => $s6Count > 0 ? round(($s6Sum / $s6Count) * 5, 1) : 0,
                's7' => $s7Count > 0 ? round(($s7Sum / $s7Count) * 5, 1) : 0,
            ];
        }

        // Modules critiques (taux d'échec > 40%)
        $modules = Module::with(['filiere', 'assessments.grades'])->get();
        $criticalModules = [];

        foreach ($modules as $module) {
            $mTotal = 0;
            $mFail = 0;

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
                        'id' => $module->id,
                        'name' => $module->name,
                        'failure_rate' => $failRate,
                        'context' => ($module->filiere->name ?? 'N/A').' — S'.$module->semester_number,
                    ];
                }
            }
        }

        usort($criticalModules, fn ($a, $b) => $b['failure_rate'] <=> $a['failure_rate']);
        $criticalModules = array_slice($criticalModules, 0, 5);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => compact('successRate', 'attendanceRate', 'overallAverage', 'scheduledExams'),
                'chart' => $chartData,
                'critical_modules' => $criticalModules,
            ],
        ]);
    }
}
