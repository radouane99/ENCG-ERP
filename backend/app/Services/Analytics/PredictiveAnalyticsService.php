<?php

namespace App\Services\Analytics;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PredictiveAnalyticsService
{
    /**
     * Get a list of students flagged as "At Risk" based on attendance and current grades
     */
    public function getAtRiskStudents(int $institutionId, int $academicYearId): array
    {
        // 1. Calculate Absenteeism Rate per Student
        // A high number of unexcused absences is a primary risk factor.
        $absences = DB::table('attendances')
            ->join('attendance_sessions', 'attendances.attendance_session_id', '=', 'attendance_sessions.id')
            ->join('students', 'attendances.student_id', '=', 'students.id')
            ->where('attendance_sessions.academic_year_id', $academicYearId)
            ->where('attendances.status', 'absent')
            ->where('attendances.is_justified', false)
            ->select('student_id', DB::raw('count(*) as total_absences'))
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        // 2. Calculate average of Continuous Control (CC) grades per student
        // A low average on initial assessments predicts failure.
        $ccGrades = DB::table('grades')
            ->join('grade_components', 'grades.grade_component_id', '=', 'grade_components.id')
            ->join('exam_sessions', 'grades.exam_session_id', '=', 'exam_sessions.id')
            ->where('exam_sessions.academic_year_id', $academicYearId)
            ->where('grade_components.code', 'cc')
            ->select('student_id', DB::raw('AVG(score) as average_cc'))
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        // 3. Aggregate all active students and calculate Risk Score
        $students = DB::table('students')
            ->where('institution_id', $institutionId)
            ->where('status', 'active')
            ->get();

        $atRiskList = [];

        foreach ($students as $student) {
            $studentAbsences = $absences->get($student->id)->total_absences ?? 0;
            $studentCCAvg = $ccGrades->get($student->id)->average_cc ?? null;

            // Algorithm Weighting
            // Max Risk Score = 100
            // 5 absences = 50 points (10 pts per absence)
            // CC Average below 10 = adds risk.
            
            $riskScore = 0;
            $riskFactors = [];

            // Absence Risk
            if ($studentAbsences > 0) {
                $absenceRisk = min(50, $studentAbsences * 10);
                $riskScore += $absenceRisk;
                if ($studentAbsences >= 3) {
                    $riskFactors[] = "Absentéisme élevé ($studentAbsences absences non justifiées)";
                }
            }

            // Grade Risk
            if ($studentCCAvg !== null && $studentCCAvg < 10) {
                // If average is 8, deficit is 2. Multiplying by 10 gives 20 risk points.
                $deficit = 10 - $studentCCAvg;
                $gradeRisk = min(50, $deficit * 10);
                $riskScore += $gradeRisk;
                
                if ($studentCCAvg < 8) {
                    $riskFactors[] = "Lacunes critiques en CC (Moyenne: " . round($studentCCAvg, 2) . "/20)";
                }
            }

            // Flag if Risk Score > 60
            if ($riskScore >= 60) {
                $atRiskList[] = [
                    'student_id' => $student->id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'student_number' => $student->student_number,
                    'risk_score' => round($riskScore),
                    'absences' => $studentAbsences,
                    'cc_average' => $studentCCAvg ? round($studentCCAvg, 2) : 'N/A',
                    'risk_factors' => $riskFactors,
                    'category' => $riskScore >= 80 ? 'CRITICAL' : 'WARNING'
                ];
            }
        }

        // Sort by risk score descending
        usort($atRiskList, fn($a, $b) => $b['risk_score'] <=> $a['risk_score']);

        return [
            'total_analyzed' => $students->count(),
            'total_at_risk' => count($atRiskList),
            'critical_count' => collect($atRiskList)->where('category', 'CRITICAL')->count(),
            'students' => array_slice($atRiskList, 0, 50) // Return top 50
        ];
    }
}
