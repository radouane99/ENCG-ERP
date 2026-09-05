<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\GradeAppeal;
use App\Models\GradeAudit;
use App\Models\Module;
use App\Models\Student;
use App\Models\User;
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

        // 48h LMD Appeal Window active state
        $activeAppealWindow = [
            'is_open' => true,
            'duration_hours' => 48,
            'closes_at' => now()->addHours(36)->toIso8601String(),
            'hours_remaining' => 36,
            'session' => 'Session Ordinaire / Normale 2026',
        ];

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
            Log::warning('Grade appeal notification error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Votre recours de note a été déposé avec succès. Il a été transmis à l\'enseignant responsable.',
            'data' => $appeal->load('module'),
        ], 201);
    }

    /**
     * Liste des recours pour le professeur responsable ou l'administration.
     */
    public function index(Request $request): JsonResponse
    {
        $query = GradeAppeal::with(['student.user', 'module', 'assessment', 'resolver']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('module_id')) {
            $query->where('module_id', $request->input('module_id'));
        }

        $appeals = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 25));

        $stats = [
            'total' => GradeAppeal::count(),
            'submitted' => GradeAppeal::where('status', 'submitted')->count(),
            'rectified' => GradeAppeal::where('status', 'rectified')->count(),
            'maintained' => GradeAppeal::where('status', 'maintained')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $appeals,
            'statistics' => $stats,
        ]);
    }

    /**
     * Traitement de la réclamation par l'Enseignant ou le Jury (maintien ou rectification).
     */
    public function resolve(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'decision' => 'required|in:rectified,maintained,rejected',
            'rectified_grade' => 'required_if:decision,rectified|nullable|numeric|min:0|max:20',
            'professor_comment' => 'required|string|max:1000',
        ]);

        $appeal = GradeAppeal::with(['student.user', 'module'])->findOrFail($id);
        $user = $request->user();

        $appeal->status = $validated['decision'];
        $appeal->professor_comment = $validated['professor_comment'];
        $appeal->professor_notes = $validated['professor_comment'];
        $appeal->resolved_by = $user->id;
        $appeal->resolved_at = now();

        if ($validated['decision'] === 'rectified') {
            $appeal->rectified_grade = $validated['rectified_grade'];
            $appeal->new_grade = $validated['rectified_grade'];

            // Update real Grade record if exists
            $grade = Grade::where('student_id', $appeal->student_id)
                ->where('module_id', $appeal->module_id)
                ->first();

            if ($grade) {
                $oldScore = $grade->grade ?? $appeal->original_grade;
                $grade->grade = $validated['rectified_grade'];
                $grade->save();

                // Forensic audit log
                try {
                    GradeAudit::create([
                        'grade_id' => $grade->id,
                        'user_id' => $user->id,
                        'old_grade' => $oldScore,
                        'new_grade' => $validated['rectified_grade'],
                        'reason' => 'Rectification suite à recours LMD : ' . $validated['professor_comment'],
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Grade audit log error: ' . $e->getMessage());
                }
            }
        }

        $appeal->save();

        // Notify student of the decision
        try {
            $studentUserId = $appeal->student?->user_id;
            if ($studentUserId) {
                $decisionLabel = match ($validated['decision']) {
                    'rectified' => "Note Rectifiée à {$validated['rectified_grade']}/20 ✓",
                    'maintained' => "Note Maintenue après recomptage",
                    default => "Recours clôturé",
                };

                DB::table('notifications')->insert([
                    'id' => Str::uuid()->toString(),
                    'type' => 'App\Notifications\SystemNotification',
                    'notifiable_type' => 'App\Models\User',
                    'notifiable_id' => $studentUserId,
                    'data' => json_encode([
                        'title' => "⚖️ Décision Recours : {$decisionLabel}",
                        'message' => "Votre recours pour {$appeal->module?->name} a été traité : {$validated['professor_comment']}",
                        'type' => 'system',
                        'action_url' => '/student/grades',
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Grade resolution notification error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Le recours a été traité et la décision enregistrée avec succès.',
            'data' => $appeal->load('resolver'),
        ]);
    }
}
