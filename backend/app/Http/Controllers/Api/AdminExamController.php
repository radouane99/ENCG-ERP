<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Grade;
use App\Models\Assessment;
use App\Models\Module;
use App\Models\Department;
use App\Models\Exam;

class AdminExamController extends Controller
{
    public function index()
    {
        $exams = Exam::with(['module', 'group', 'room'])->latest()->get()->map(function ($exam) {
            return [
                'id' => $exam->id,
                'module' => $exam->module,
                'group' => $exam->group,
                'room' => $exam->room,
                'exam_date' => $exam->exam_date,
                'start_time' => $exam->start_time,
                'duration_minutes' => $exam->duration_minutes,
                'type' => $exam->session_type ?? 'EXAMEN',
                'generated_count' => 0, // Mocked for now, can be computed if ExamConvocation model is used
                'sent_count' => 0,
                'pending_count' => 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $exams
        ]);
    }
    public function analytics()
    {
        // KPIs
        $totalGrades = Grade::count();
        $presentGrades = Grade::where('absent', false)->count();
        $passingGrades = Grade::where('absent', false)->where('value', '>=', 10)->count();
        
        $attendanceRate = $totalGrades > 0 ? round(($presentGrades / $totalGrades) * 100, 1) : 0;
        $successRate = $presentGrades > 0 ? round(($passingGrades / $presentGrades) * 100, 1) : 0;
        
        $overallAverage = Grade::where('absent', false)->avg('value');
        $overallAverage = $overallAverage ? round($overallAverage, 2) : 0;
        
        $scheduledExams = Assessment::count();

        // Chart Data (Evolution of averages by department for S6 vs S7)
        $departments = Department::with(['filieres.modules.assessments.grades' => function($q) {
            $q->where('absent', false);
        }])->get();

        $chartData = [];
        foreach ($departments as $dept) {
            $s6Sum = 0; $s6Count = 0;
            $s7Sum = 0; $s7Count = 0;

            foreach ($dept->filieres as $filiere) {
                foreach ($filiere->modules as $module) {
                    if ($module->semester_number == 6 || $module->semester_number == 7) {
                        foreach ($module->assessments as $assessment) {
                            foreach ($assessment->grades as $grade) {
                                if ($module->semester_number == 6) {
                                    $s6Sum += $grade->value;
                                    $s6Count++;
                                } else if ($module->semester_number == 7) {
                                    $s7Sum += $grade->value;
                                    $s7Count++;
                                }
                            }
                        }
                    }
                }
            }

            // Average converted to percentage (out of 100)
            $s6Avg = $s6Count > 0 ? round(($s6Sum / $s6Count) * 5, 1) : 0;
            $s7Avg = $s7Count > 0 ? round(($s7Sum / $s7Count) * 5, 1) : 0;

            if ($s6Count > 0 || $s7Count > 0) {
                $chartData[] = [
                    'name' => $dept->name,
                    's6' => $s6Avg,
                    's7' => $s7Avg
                ];
            }
        }

        // Critical Modules (Failure rate > 40%)
        $criticalModules = [];
        $modules = Module::with(['filiere', 'assessments.grades'])->get();
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
                    $filiereName = $module->filiere ? $module->filiere->name : 'N/A';
                    $criticalModules[] = [
                        'id' => $module->id,
                        'name' => $module->name,
                        'failure_rate' => $failRate,
                        'context' => "{$filiereName} — S{$module->semester_number}"
                    ];
                }
            }
        }

        usort($criticalModules, function($a, $b) {
            return $b['failure_rate'] <=> $a['failure_rate'];
        });
        
        $criticalModules = array_slice($criticalModules, 0, 5);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'success_rate' => $successRate,
                    'attendance_rate' => $attendanceRate,
                    'overall_average' => $overallAverage,
                    'scheduled_exams' => $scheduledExams
                ],
                'chart' => $chartData,
                'critical_modules' => $criticalModules
            ]
        ]);
    }
}
