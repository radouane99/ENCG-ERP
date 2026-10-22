<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Models\ExamSession;
use App\Models\Grade;
use App\Models\GradeAppeal;
use App\Models\GradeAudit;
use App\Models\Module;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GradeAppealController extends Controller
{
    /**
     * Liste des recours déposés par l'étudiant connecté avec calcul du délai LMD 48h.
     */
    public function studentIndex(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $appeals = GradeAppeal::with(['module', 'assessment'])
            ->where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // 48h LMD Appeal Window — calculée depuis la session d'examen active
        $activeAppealWindow = $this->resolveAppealWindow();

        return response()->json([
            'success' => true,
            'data' => [
                'appeals' => $appeals,
                'appeal_window' => $activeAppealWindow,
            ],
        ]);
    }

    /**
     * Dépôt d'une réclamation officielle de note (Recours LMD 48h).
     */
    public function studentStore(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'assessment_id' => 'nullable|exists:assessments,id',
            'original_grade' => 'required|numeric|min:0|max:20',
            'claimed_grade' => 'nullable|numeric|min:0|max:20',
            'reason_category' => 'required|string|in:erreur_materielle,oubli_cc,non_report,autre',
            'student_justification' => 'required|string|min:10|max:1000',
        ]);

        // Check if student already submitted an active appeal for this module
        $existing = GradeAppeal::where('student_id', $student->id)
            ->where('module_id', $validated['module_id'])
            ->whereIn('status', ['submitted', 'under_review'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Un recours est déjà en cours de traitement pour ce module.',
            ], 422);
        }

        $appeal = GradeAppeal::create([
            'student_id' => $student->id,
            'module_id' => $validated['module_id'],
            'assessment_id' => $validated['assessment_id'] ?? null,
            'original_grade' => $validated['original_grade'],
            'old_grade' => $validated['original_grade'],
            'claimed_grade' => $validated['claimed_grade'] ?? null,
            'reason_category' => $validated['reason_category'],
            'reason' => $validated['student_justification'],
            'student_justification' => $validated['student_justification'],
            'status' => 'submitted',
            'appeal_deadline_at' => now()->addHours(48),
        ]);

        // In-app notification for the student
        try {
            DB::table('notifications')->insert([
                'id' => Str::uuid()->toString(),
                'type' => 'App\Notifications\SystemNotification',
                'notifiable_type' => 'App\Models\User',
                'notifiable_id' => $user->id,
                'data' => json_encode([
                    'title' => '⚖️ Recours de Note Enregistré',
                    'message' => "Votre réclamation pour le module a été transmise à l'enseignant responsable. Traitement sous 48h.",
                    'type' => 'system',
                    'action_url' => '/student/grades',
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Grade appeal notification error: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Votre recours de note a été déposé avec succès. Il a été transmis à l\'enseignant responsable.',
            'data' => $appeal->load('module'),
        ], 201);
    }

    /**
     * Liste des recours pour le professeur responsable ou l'administration.
     *
     * - Admins/Direction/Pédagogie : voient TOUS les recours de l'établissement.
     * - Professeurs/Vacataires      : voient UNIQUEMENT les recours des modules
     *                                 qu'ils enseignent (ségrégation de données).
     */
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = GradeAppeal::with(['student.user', 'module', 'assessment', 'resolver']);

        // ─ Scoping par rôle ───────────────────────────────────────────────────────────
        $isAdmin = $user->hasAnyRole([
            'super-admin', 'admin', 'institution-admin',
            'director', 'pedagogy_officer', 'department_head', 'scolarite',
        ]);

        $assignedModuleIds = collect();

        if (! $isAdmin && $user->hasAnyRole(['professor', 'vacataire'])) {
            $assignedModuleIds = DB::table('module_professor')
                ->where('professor_id', function ($q) use ($user) {
                    $q->select('id')
                      ->from('professors')
                      ->where('user_id', $user->id)
                      ->limit(1);
                })
                ->pluck('module_id');

            if ($assignedModuleIds->isEmpty()) {
                return response()->json([
                    'success'    => true,
                    'data'       => [],
                    'statistics' => ['total' => 0, 'submitted' => 0, 'rectified' => 0, 'maintained' => 0],
                ]);
            }

            $query->whereIn('module_id', $assignedModuleIds);
        }
        // ─────────────────────────────────────────────────────────────────────

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('module_id')) {
            $query->where('module_id', $request->input('module_id'));
        }

        $appeals = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 25));

        // Stats calculées sur le même scope (pas l'établissement entier pour les profs)
        $statsBase = GradeAppeal::query();
        if (! $isAdmin && $assignedModuleIds->isNotEmpty()) {
            $statsBase->whereIn('module_id', $assignedModuleIds);
        }

        $stats = [
            'total'      => (clone $statsBase)->count(),
            'submitted'  => (clone $statsBase)->where('status', 'submitted')->count(),
            'rectified'  => (clone $statsBase)->where('status', 'rectified')->count(),
            'maintained' => (clone $statsBase)->where('status', 'maintained')->count(),
        ];

        return response()->json([
            'success'    => true,
            'data'       => $appeals,
            'statistics' => $stats,
        ]);
    }

    /**
     * Traitement de la réclamation par l'Enseignant ou le Jury (maintien ou rectification).
     */
    public function resolve(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'decision' => 'nullable|in:rectified,maintained,rejected',
            'status' => 'nullable|in:rectified,maintained,rejected',
            'rectified_grade' => 'nullable|numeric|min:0|max:20',
            'new_grade' => 'nullable|numeric|min:0|max:20',
            'professor_comment' => 'nullable|string|max:1000',
            'resolution_notes' => 'nullable|string|max:1000',
        ]);

        $decision = $validated['decision'] ?? $validated['status'] ?? null;
        if (! $decision) {
            return response()->json([
                'success' => false,
                'message' => 'Le champ décision (ou statut) est requis.',
            ], 422);
        }

        $rectifiedGrade = $validated['rectified_grade'] ?? $validated['new_grade'] ?? null;
        if ($decision === 'rectified' && $rectifiedGrade === null) {
            return response()->json([
                'success' => false,
                'message' => 'La note rectifiée est requise en cas de rectification.',
            ], 422);
        }

        $comment = $validated['professor_comment'] ?? $validated['resolution_notes'] ?? 'Décision enregistrée.';

        $appeal = GradeAppeal::with(['student.user', 'module'])->findOrFail($id);
        $user = $request->user();

        // Contrôle d'autorisation : Administrateurs ou Enseignant affecté au module
        $isAdmin = $user->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director', 'pedagogy_officer', 'department_head']);
        if (! $isAdmin) {
            $isAssigned = app(\App\Services\Academic\GradeService::class)->isProfessorAssignedToModule($user->id, (int) $appeal->module_id);
            if (! $isAssigned) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès refusé : Vous n\'êtes pas l\'enseignant affecté à ce module.',
                ], 403);
            }
        }

        $appeal->status = $decision;
        $appeal->professor_comment = $comment;
        $appeal->professor_notes = $comment;
        $appeal->resolved_by = $user->id;
        $appeal->resolved_at = now();

        if ($decision === 'rectified') {
            $appeal->rectified_grade = (float) $rectifiedGrade;
            $appeal->new_grade = (float) $rectifiedGrade;

            // Recherche et mise à jour de la note réelle via assessment_id
            $grade = null;
            if ($appeal->assessment_id) {
                $grade = Grade::where('student_id', $appeal->student_id)
                    ->where('assessment_id', $appeal->assessment_id)
                    ->first();
            }

            if (! $grade && $appeal->module_id) {
                $assessmentIds = \App\Models\Assessment::where('module_id', $appeal->module_id)->pluck('id');
                $grade = Grade::where('student_id', $appeal->student_id)
                    ->whereIn('assessment_id', $assessmentIds)
                    ->first();
            }

            if ($grade) {
                $oldScore = $grade->value ?? $appeal->original_grade;
                $grade->value = (float) $rectifiedGrade;
                $grade->absent = false;
                $grade->save();

                // Traçabilité légale CNDP / Audit Log
                try {
                    GradeAudit::create([
                        'grade_id' => $grade->id,
                        'user_id' => $user->id,
                        'old_value' => $oldScore,
                        'new_value' => (float) $rectifiedGrade,
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'reason' => 'Rectification suite à recours LMD : '.$comment,
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Grade audit log error: '.$e->getMessage());
                }
            }
        }

        $appeal->save();

        // Notification in-app de l'étudiant
        try {
            $studentUserId = $appeal->student?->user_id;
            if ($studentUserId) {
                $decisionLabel = match ($decision) {
                    'rectified' => "Note Rectifiée à {$rectifiedGrade}/20 ✓",
                    'maintained' => 'Note Maintenue après recomptage',
                    default => 'Recours clôturé',
                };

                DB::table('notifications')->insert([
                    'id' => Str::uuid()->toString(),
                    'type' => 'App\Notifications\SystemNotification',
                    'notifiable_type' => 'App\Models\User',
                    'notifiable_id' => $studentUserId,
                    'data' => json_encode([
                        'title' => "⚖️ Décision Recours : {$decisionLabel}",
                        'message' => "Votre recours pour {$appeal->module?->name} a été traité : {$comment}",
                        'type' => 'system',
                        'action_url' => '/student/grades',
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Grade resolution notification error: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Le recours a été traité et la décision enregistrée avec succès.',
            'data'    => $appeal->load('resolver'),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers privés
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calcule dynamiquement la fenêtre de recours LMD 48h depuis la
     * session d'examen active la plus récente.
     *
     * Règle : la fenêtre s'ouvre à la fin de la session (end_date)
     * et reste ouverte 48h.
     *
     * @return array{is_open: bool, duration_hours: int, closes_at: string|null,
     *               hours_remaining: float, session: string|null}
     */
    private function resolveAppealWindow(): array
    {
        /** @var \App\Models\ExamSession|null $session */
        $session = ExamSession::where('is_active', true)
            ->latest('end_date')
            ->first();

        if (! $session) {
            return [
                'is_open'         => false,
                'duration_hours'  => 48,
                'closes_at'       => null,
                'hours_remaining' => 0,
                'session'         => null,
            ];
        }

        $resultsPublishedAt = $session->end_date
            ? \Carbon\Carbon::parse($session->end_date)
            : null;

        if (! $resultsPublishedAt) {
            return [
                'is_open'         => false,
                'duration_hours'  => 48,
                'closes_at'       => null,
                'hours_remaining' => 0,
                'session'         => $session->name,
            ];
        }

        $appealDeadline  = $resultsPublishedAt->copy()->addHours(48);
        $now             = now();
        $isOpen          = $now->between($resultsPublishedAt, $appealDeadline);
        $hoursRemaining  = $isOpen
            ? max(0, round($now->diffInMinutes($appealDeadline) / 60, 1))
            : 0;

        return [
            'is_open'         => $isOpen,
            'duration_hours'  => 48,
            'closes_at'       => $isOpen ? $appealDeadline->toIso8601String() : null,
            'hours_remaining' => $hoursRemaining,
            'session'         => $session->name,
        ];
    }
}
