<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\CourseEvaluation;
use App\Models\DocumentRequest;
use App\Models\EvaluationCampaign;
use App\Models\Exam;
use App\Models\Internship;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminAlertsController extends Controller
{
    /**
     * Agrège les alertes en temps réel depuis la base de données.
     */
    public function getAlerts(): JsonResponse
    {
        $alerts = [];
        $id = 1;

        // ── 1. Étudiants à risque (> 10 absences) ──────────────────────
        $studentsAtRisk = Student::has('attendances', '>', 10)->count();

        if ($studentsAtRisk > 0) {
            $alerts[] = [
                'id' => $id++,
                'type' => 'CRITIQUE',
                'category' => 'Scolarité',
                'title' => 'Étudiants en situation de décrochage',
                'description' => "$studentsAtRisk étudiant(s) ont un taux d'absences élevé (>10 absences).",
                'count' => $studentsAtRisk,
                'link' => '/admin/students-risk',
            ];
        }

        // ── 2. Notes non saisies depuis +14 jours ──────────────────────
        $missedGrades = Assessment::where('date', '<', now()->subDays(14)->toDateString())
            ->whereDoesntHave('grades')
            ->count();

        if ($missedGrades > 0) {
            $alerts[] = [
                'id' => $id++,
                'type' => 'CRITIQUE',
                'category' => 'Examens',
                'title' => 'Épreuves sans saisie de notes',
                'description' => "$missedGrades épreuve(s) planifiée(s) il y a plus de 14 jours sans notes.",
                'count' => $missedGrades,
                'link' => '/admin/grades',
            ];
        }

        // ── 3. Demandes de documents en attente > 48h ─────────────────
        $pendingDocs = DocumentRequest::where('status', 'pending')
            ->where('created_at', '<', now()->subHours(48))
            ->count();

        if ($pendingDocs > 0) {
            $alerts[] = [
                'id' => $id++,
                'type' => $pendingDocs > 5 ? 'CRITIQUE' : 'AVERTISSEMENT',
                'category' => 'Guichet Électronique',
                'title' => 'Demandes de documents en attente depuis >48h',
                'description' => "$pendingDocs demande(s) en attente depuis plus de 48 heures.",
                'count' => $pendingDocs,
                'link' => '/admin/requests',
            ];
        }

        // ── 4. Examens sans convocations (7 prochains jours) ──────────
        $examsWithoutConv = Exam::whereBetween('exam_date', [
            now()->toDateString(),
            now()->addDays(7)->toDateString(),
        ])
            ->whereDoesntHave('convocations')
            ->count();

        if ($examsWithoutConv > 0) {
            $alerts[] = [
                'id' => $id++,
                'type' => 'CRITIQUE',
                'category' => 'Convocations',
                'title' => 'Examens sans convocations générées',
                'description' => "$examsWithoutConv examen(s) dans les 7 jours sans convocations.",
                'count' => $examsWithoutConv,
                'link' => '/admin/convocations',
            ];
        }

        // ── 5. Professeurs sans disponibilités ────────────────────────
        $profWithoutAvail = User::whereHas('professor')
            ->whereDoesntHave('professorAvailabilities')
            ->count();

        if ($profWithoutAvail > 0) {
            $alerts[] = [
                'id' => $id++,
                'type' => 'AVERTISSEMENT',
                'category' => 'Corps Professoral',
                'title' => 'Professeurs sans disponibilités soumises',
                'description' => "$profWithoutAvail professeur(s) n'ont pas soumis leurs créneaux.",
                'count' => $profWithoutAvail,
                'link' => '/admin/professor-availability',
            ];
        }

        // ── 6. Campagne d'évaluation ouverte sans réponses ────────────
        $campaignOpen = EvaluationCampaign::where('status', 'OPEN')->exists();
        $evalCount = CourseEvaluation::count();

        if ($campaignOpen && $evalCount === 0) {
            $alerts[] = [
                'id' => $id++,
                'type' => 'AVERTISSEMENT',
                'category' => 'Évaluations',
                'title' => "Campagne d'évaluation ouverte sans réponses",
                'description' => "La campagne est ouverte mais aucun étudiant n'a soumis d'évaluation.",
                'count' => 0,
                'link' => '/admin/evaluations',
            ];
        }

        // ── 7. PFE sans encadreur ─────────────────────────────────────
        $pfeWithoutSupervisor = Internship::whereNull('supervisor_id')
            ->where('status', '!=', 'rejected')
            ->count();

        if ($pfeWithoutSupervisor > 0) {
            $alerts[] = [
                'id' => $id++,
                'type' => 'AVERTISSEMENT',
                'category' => 'PFE & Stages',
                'title' => "PFE en attente d'affectation d'encadreur",
                'description' => "$pfeWithoutSupervisor projet(s) PFE sans encadreur affecté.",
                'count' => $pfeWithoutSupervisor,
                'link' => '/admin/pfe-workflow',
            ];
        }

        // ── Stats ────────────────────────────────────────────────────
        return response()->json([
            'success' => true,
            'alerts' => $alerts,
            'stats' => [
                'critiques' => count(array_filter($alerts, fn ($a) => $a['type'] === 'CRITIQUE')),
                'avertissements' => count(array_filter($alerts, fn ($a) => $a['type'] === 'AVERTISSEMENT')),
                'students_at_risk' => $studentsAtRisk,
                'pending_documents' => $pendingDocs,
                'last_refresh' => now()->toIso8601String(),
            ],
        ]);
    }
}
