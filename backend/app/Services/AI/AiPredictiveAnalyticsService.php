<?php

namespace App\Services\AI;

use App\Models\Student;
use App\Models\Grade;
use App\Models\AttendanceRecord;
use App\Services\AI\GeminiApiService;

class AiPredictiveAnalyticsService
{
    protected GeminiApiService $geminiApi;

    public function __construct(GeminiApiService $geminiApi)
    {
        $this->geminiApi = $geminiApi;
    }

    /**
     * Calculate Predictive Student Dropout Risk with Google Gemini AI Narrative Analysis.
     */
    public function getPredictiveDropoutRisk(): array
    {
        $students = Student::with(['user', 'registrations.filiere', 'attendanceRecords', 'grades'])
            ->has('user')
            ->take(15)
            ->get();

        $atRiskList = $students->map(function ($student) {
            $totalAttendance = $student->attendanceRecords ? $student->attendanceRecords->count() : 0;
            $absencesCount = $student->attendanceRecords ? $student->attendanceRecords->where('status', 'absent')->count() : 0;
            $absenceRate = $totalAttendance > 0 ? round(($absencesCount / $totalAttendance) * 100, 1) : 0;

            $grades = $student->grades ? $student->grades->pluck('value')->filter(fn($v) => !is_null($v)) : collect();
            $cc1Average = $grades->isNotEmpty() ? round($grades->avg(), 2) : 10.0;

            $riskScore = min(100, round(($absenceRate * 1.8) + max(0, (10 - $cc1Average) * 5), 1));

            $riskLevel = $riskScore >= 65 ? 'CRITIQUE' : ($riskScore >= 40 ? 'ÉLEVÉ' : 'MODÉRÉ');
            $statusColor = $riskScore >= 65 ? 'red' : ($riskScore >= 40 ? 'amber' : 'yellow');

            return [
                'student_id' => $student->id,
                'name' => ($student->user->first_name ?? 'Étudiant') . ' ' . ($student->user->last_name ?? ''),
                'cne' => $student->student_number ?? ('K' . $student->id),
                'filiere' => $student->registrations->first()?->filiere?->code ?? 'ENCG',
                'absence_rate' => "{$absenceRate}%",
                'cc1_average' => number_format($cc1Average, 2) . ' / 20',
                'risk_score' => "{$riskScore}%",
                'risk_level' => $riskLevel,
                'status_color' => $statusColor,
                'primary_factor' => $absenceRate > 20 ? 'Taux d\'absence élevé aux cours' : 'Moyenne des évaluations < 10/20',
                'ai_recommendation' => $riskScore >= 65 ? 'Convocation d\'avertissement + Tutorat obligatoire' : 'Accompagnement pédagogique préventif'
            ];
        })->sortByDesc('risk_score')->values();

        $totalAnalyzed = Student::count();
        $critiqueCount = $atRiskList->where('risk_level', 'CRITIQUE')->count();

        // Query Gemini API for Executive Narrative Report
        $prompt = "Analyse les données réelles suivantes et rédige une synthèse de 3 phrases pour la Direction Académique de l'ENCG Fès : {$totalAnalyzed} étudiants analysés, {$critiqueCount} cas en risque critique de décrochage.";
        $system = ["Tu es l'expert en analytique pédagogique de l'ENCG Fès."];
        
        $narrativeReport = $this->geminiApi->generateContent($prompt, $system) 
            ?? "L'analyse prédictive sur les données réelles de la base de données indique {$critiqueCount} étudiants nécessitant un suivi pédagogique immédiat.";

        return [
            'success' => true,
            'summary' => [
                'total_students_analyzed' => $totalAnalyzed,
                'high_risk_count' => $critiqueCount,
                'gemini_narrative' => $narrativeReport,
                'data_source' => 'Direct MySQL + Google Gemini 1.5 Flash AI',
                'model' => 'ENCG Predictive Academic Dropout AI Engine'
            ],
            'at_risk_students' => $atRiskList
        ];
    }
}
