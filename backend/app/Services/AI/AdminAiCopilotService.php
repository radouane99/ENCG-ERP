<?php

namespace App\Services\AI;

use App\Models\Student;
use App\Models\Professor;
use App\Models\Grade;
use App\Models\Schedule;
use App\Models\DisciplineCase;
use App\Models\VacationContract;
use Illuminate\Support\Facades\DB;

class AdminAiCopilotService
{
    /**
     * Process natural language query from Admin Copilot using real MySQL Database queries.
     */
    public function processQuery(string $query): array
    {
        $queryLower = mb_strtolower($query);

        // 1. Success Rate & Academic Performance
        if (str_contains($queryLower, 'reussite') || str_contains($queryLower, 'moyenne') || str_contains($queryLower, 'taux') || str_contains($queryLower, 'نجاح')) {
            $totalStudents = Student::count();
            $admittedCount = Student::where('status', 'active')->count();
            $rate = $totalStudents > 0 ? round(($admittedCount / $totalStudents) * 100, 1) : 0;

            $rattrapageCount = Grade::where('value', '<', 10.0)
                ->where('value', '>=', 6.0)
                ->distinct('student_id')
                ->count('student_id');

            return [
                'type' => 'academic_performance',
                'answer' => "D'après l'analyse en temps réel de la base de données MySQL, le taux global de réussite calculé pour l'ENCG Fès est de **{$rate}%** ({$admittedCount} étudiants actifs sur {$totalStudents}).",
                'kpis' => [
                    ['label' => 'Taux de Réussite Réel', 'value' => "{$rate}%", 'trend' => 'MySQL Live'],
                    ['label' => 'Total Étudiants Inscrits', 'value' => number_format($totalStudents), 'trend' => 'Base Officielle'],
                    ['label' => 'Étudiants en Rattrapage', 'value' => number_format($rattrapageCount), 'trend' => 'Base de Notes']
                ],
                'action_suggestion' => 'Lancer la simulation de délibération Apogée pour les PVs officiels.'
            ];
        }

        // 2. Attendance & Dropout Risk Query
        if (str_contains($queryLower, 'absence') || str_contains($queryLower, 'decrochage') || str_contains($queryLower, 'risque') || str_contains($queryLower, 'غياب')) {
            $atRiskCount = Student::whereIn('status', ['at_risk', 'excluded'])->count();
            $totalAbsences = \App\Models\AttendanceRecord::where('status', 'absent')->count();

            return [
                'type' => 'dropout_risk',
                'answer' => "L'analyse réelle des registres d'assiduité révèle **{$atRiskCount} étudiants enregistrés en risque académique ou d'exclusion**, avec un total cumulé de **{$totalAbsences} absences** aux séances de cours.",
                'kpis' => [
                    ['label' => 'Étudiants à Risque Réels', 'value' => (string)$atRiskCount, 'color' => 'red'],
                    ['label' => 'Absences Enregistrées', 'value' => number_format($totalAbsences), 'color' => 'amber'],
                    ['label' => 'Base d\'Assiduité', 'value' => 'Direct MySQL', 'color' => 'blue']
                ],
                'action_suggestion' => 'Envoyer une convocation d\'avertissement pour absence au Service de la Scolarité.'
            ];
        }

        // 3. Vacataires & Financial Payout Query
        if (str_contains($queryLower, 'budget') || str_contains($queryLower, 'vacation') || str_contains($queryLower, 'paie') || str_contains($queryLower, 'daf') || str_contains($queryLower, 'مالية')) {
            $contracts = VacationContract::with(['sessions', 'payments'])->get();
            $totalBudget = 0;
            $totalHours = 0;

            foreach ($contracts as $contract) {
                $hours = $contract->sessions ? $contract->sessions->sum('hours') : ($contract->agreed_hours ?? 0);
                $rate = $contract->hourly_rate ?? 350;
                $totalBudget += ($hours * $rate);
                $totalHours += $hours;
            }

            return [
                'type' => 'financial_forecast',
                'answer' => "Le calcul budgétaire réel des vacations enregistrées dans la base de données donne un total de **" . number_format($totalBudget, 2) . " MAD** pour **{$totalHours} heures** d'enseignement émargées.",
                'kpis' => [
                    ['label' => 'Total Budgété Réel', 'value' => number_format($totalBudget, 2) . ' MAD', 'trend' => 'MySQL Live'],
                    ['label' => 'Heures Émargées', 'value' => "{$totalHours}h", 'trend' => 'Sessions DB'],
                    ['label' => 'Contrats Vacataires', 'value' => (string)$contracts->count(), 'trend' => 'Contrats Actifs']
                ],
                'action_suggestion' => 'Télécharger le bordereau de virement global pour la DAF.'
            ];
        }

        // 4. Discipline & Fraud Query
        if (str_contains($queryLower, 'discipline') || str_contains($queryLower, 'fraude') || str_contains($queryLower, 'conseil') || str_contains($queryLower, 'غش')) {
            $casesCount = DisciplineCase::count();
            $resolvedCount = DisciplineCase::where('status', 'resolved')->count();

            return [
                'type' => 'discipline_cases',
                'answer' => "La base disciplinaire contient actuellement **{$casesCount} dossiers enregistrés**, dont **{$resolvedCount} décisions résolues** par le Conseil de Discipline.",
                'kpis' => [
                    ['label' => 'Total Dossiers Réels', 'value' => (string)$casesCount, 'color' => 'amber'],
                    ['label' => 'Décisions Résolues', 'value' => (string)$resolvedCount, 'color' => 'blue'],
                    ['label' => 'Source de Données', 'value' => 'Table discipline_cases', 'color' => 'emerald']
                ],
                'action_suggestion' => 'Consulter les PVs des décisions du Conseil de Discipline.'
            ];
        }

        // Default Real DB Response
        $totalStudents = Student::count();
        $totalProfs = Professor::count();
        $totalSchedules = Schedule::count();

        return [
            'type' => 'general_assistant',
            'answer' => "Connexion directe à la base MySQL ENCG Fès établie avec succès. Le système gère actuellement **{$totalStudents} étudiants**, **{$totalProfs} professeurs** et **{$totalSchedules} séances de cours** au planning.",
            'kpis' => [
                ['label' => 'Étudiants en Base', 'value' => number_format($totalStudents), 'trend' => 'Table students'],
                ['label' => 'Corps Enseignant', 'value' => number_format($totalProfs), 'trend' => 'Table professors'],
                ['label' => 'Séances Planifiées', 'value' => number_format($totalSchedules), 'trend' => 'Table schedules']
            ],
            'action_suggestion' => 'Posez une question spécifique sur les réquisitions, délibérations, absences ou le budget.'
        ];
    }
}
