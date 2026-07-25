<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminAlertsController extends Controller
{
    /**
     * Aggregate real-time alerts from all DB sources.
     */
    public function getAlerts(): JsonResponse
    {
        try {
            $alerts = [];
            $id = 1;

            // ── 1. Étudiants à risque (> 30% absences) ──────────────────────
            $studentsAtRisk = DB::table('students')
                ->join('users', 'students.user_id', '=', 'users.id')
                ->select('students.id', 'users.name')
                ->whereExists(function ($q) {
                    $q->select(DB::raw('1'))
                        ->from('absences')
                        ->whereColumn('absences.student_id', 'students.id')
                        ->havingRaw('COUNT(*) > 10')
                        ->groupBy('absences.student_id');
                })->count();

            if ($studentsAtRisk > 0) {
                $alerts[] = [
                    'id' => $id++,
                    'type' => 'CRITIQUE',
                    'category' => 'Scolarité',
                    'title' => 'Étudiants en situation de décrochage',
                    'description' => "$studentsAtRisk étudiant(s) ont un taux d'absences élevé (>10 absences enregistrées). Intervention conseillée.",
                    'count' => $studentsAtRisk,
                    'link' => '/admin/students-risk',
                ];
            }

            // ── 2. Notes non saisies (modules sans notes depuis > 14 jours) ──
            $missedGradeModules = DB::table('assessments')
                ->where('date', '<', now()->subDays(14)->toDateString())
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw('1'))
                        ->from('grades')
                        ->whereColumn('grades.assessment_id', 'assessments.id');
                })->count();

            if ($missedGradeModules > 0) {
                $alerts[] = [
                    'id' => $id++,
                    'type' => 'CRITIQUE',
                    'category' => 'Examens',
                    'title' => 'Épreuves sans saisie de notes',
                    'description' => "$missedGradeModules épreuve(s) planifiée(s) il y a plus de 14 jours n'ont pas encore de notes saisies.",
                    'count' => $missedGradeModules,
                    'link' => '/admin/grades',
                ];
            }

            // ── 3. Demandes de documents en attente > 48h ─────────────────
            $pendingDocs = DB::table('document_requests')
                ->where('status', 'pending')
                ->where('created_at', '<', now()->subHours(48))
                ->count();

            if ($pendingDocs > 0) {
                $alerts[] = [
                    'id' => $id++,
                    'type' => $pendingDocs > 5 ? 'CRITIQUE' : 'AVERTISSEMENT',
                    'category' => 'Guichet Électronique',
                    'title' => 'Demandes de documents en attente depuis >48h',
                    'description' => "$pendingDocs demande(s) de documents administratifs sont en attente depuis plus de 48 heures.",
                    'count' => $pendingDocs,
                    'link' => '/admin/requests',
                ];
            }

            // ── 4. Convocations non générées ──────────────────────────────
            $examsWithoutConvocations = DB::table('exams')
                ->where('date', '>', now()->toDateString())
                ->where('date', '<', now()->addDays(7)->toDateString())
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw('1'))
                        ->from('convocations')
                        ->whereColumn('convocations.exam_id', 'exams.id');
                })->count();

            if ($examsWithoutConvocations > 0) {
                $alerts[] = [
                    'id' => $id++,
                    'type' => 'CRITIQUE',
                    'category' => 'Convocations',
                    'title' => 'Examens sans convocations générées',
                    'description' => "$examsWithoutConvocations examen(s) dans les 7 prochains jours n'ont pas encore de convocations générées.",
                    'count' => $examsWithoutConvocations,
                    'link' => '/admin/convocations',
                ];
            }

            // ── 5. Professeurs n'ayant pas soumis leurs disponibilités ────
            $profWithoutAvailability = DB::table('users')
                ->where('role', 'professor')
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw('1'))
                        ->from('professor_availabilities')
                        ->whereColumn('professor_availabilities.user_id', 'users.id');
                })->count();

            if ($profWithoutAvailability > 0) {
                $alerts[] = [
                    'id' => $id++,
                    'type' => 'AVERTISSEMENT',
                    'category' => 'Corps Professoral',
                    'title' => 'Professeurs sans disponibilités soumises',
                    'description' => "$profWithoutAvailability professeur(s) n'ont pas encore soumis leurs créneaux de disponibilité.",
                    'count' => $profWithoutAvailability,
                    'link' => '/admin/professor-availability',
                ];
            }

            // ── 6. Campagne d'évaluation ouverte sans réponses ────────────
            $evalOpen = \Illuminate\Support\Facades\Schema::hasTable('evaluation_campaigns')
                && DB::table('evaluation_campaigns')->where('status', 'OPEN')->exists();
            $evalCount = \Illuminate\Support\Facades\Schema::hasTable('course_evaluations')
                ? DB::table('course_evaluations')->count()
                : 0;

            if ($evalOpen && $evalCount === 0) {
                $alerts[] = [
                    'id' => $id++,
                    'type' => 'AVERTISSEMENT',
                    'category' => 'Évaluations',
                    'title' => 'Campagne d\'évaluation ouverte sans réponses',
                    'description' => 'La campagne d\'évaluation est ouverte mais aucun étudiant n\'a encore soumis d\'évaluation.',
                    'count' => 0,
                    'link' => '/admin/evaluations',
                ];
            }

            // ── 7. PFE sans encadreur affecté ────────────────────────────
            if (\Illuminate\Support\Facades\Schema::hasTable('final_projects')) {
                $pfeWithoutSupervisor = DB::table('final_projects')
                    ->whereNull('supervisor_id')
                    ->where('status', '!=', 'rejected')
                    ->count();

                if ($pfeWithoutSupervisor > 0) {
                    $alerts[] = [
                        'id' => $id++,
                        'type' => 'AVERTISSEMENT',
                        'category' => 'PFE & Stages',
                        'title' => 'PFE en attente d\'affectation d\'encadreur',
                        'description' => "$pfeWithoutSupervisor projet(s) PFE soumis n'ont pas encore d'encadreur affecté.",
                        'count' => $pfeWithoutSupervisor,
                        'link' => '/admin/pfe-workflow',
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'alerts' => $alerts,
                'stats' => [
                    'critiques' => collect($alerts)->where('type', 'CRITIQUE')->count(),
                    'avertissements' => collect($alerts)->where('type', 'AVERTISSEMENT')->count(),
                    'students_at_risk' => $studentsAtRisk,
                    'pending_documents' => $pendingDocs,
                    'last_refresh' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'alerts' => [],
                'stats' => [],
                'error' => $e->getMessage(),
            ]);
        }
    }
}
