<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\NotificationLog;
use App\Models\Professor;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NotificationController extends Controller
{
    private function unreadCountCacheKey(int|string $userId): string
    {
        return "notifications:unread_count:{$userId}";
    }

    /**
     * Liste des notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'success' => true,
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 15, 'total' => 0, 'unread_count' => 0],
            ]);
        }

        try {
            $notifications = $user->notifications()->paginate(15);
            $unreadCount = Cache::remember(
                $this->unreadCountCacheKey($user->id),
                60,
                fn () => $user->unreadNotifications()->count()
            );

            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'meta' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'unread_count' => $unreadCount,
                    'push_subscribed' => Cache::has("pwa_push:subscriptions:{$user->id}"),
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Notifications temporairement indisponibles. Réessayez.',
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 15, 'total' => 0, 'unread_count' => 0],
            ], 503);
        }
    }

    /**
     * Marquer une notification comme lue.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->find($id);

        if (! $notification) {
            return response()->json(['success' => false, 'message' => 'Notification introuvable.'], 404);
        }

        $notification->markAsRead();
        Cache::forget($this->unreadCountCacheKey($user->id));

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue.',
        ]);
    }

    /**
     * Marquer toutes les notifications comme lues.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->unreadNotifications->markAsRead();
        Cache::forget($this->unreadCountCacheKey($user->id));

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues.',
        ]);
    }

    /**
     * Supprimer une notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->find($id);

        if (! $notification) {
            return response()->json(['success' => false, 'message' => 'Notification introuvable.'], 404);
        }

        $notification->delete();
        Cache::forget($this->unreadCountCacheKey($user->id));

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée.',
        ]);
    }

    /**
     * Enregistrer un abonnement PWA WebPush pour l'utilisateur connecté.
     */
    public function subscribePush(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'endpoint' => 'nullable|string|max:2048',
            'keys' => 'nullable|array',
            'user_agent' => 'nullable|string|max:512',
        ]);

        Cache::put("pwa_push:subscriptions:{$user->id}", [
            'user_id' => $user->id,
            'endpoint' => $validated['endpoint'] ?? 'browser-native-notification',
            'keys' => $validated['keys'] ?? [],
            'user_agent' => $validated['user_agent'] ?? (string) $request->userAgent(),
            'subscribed_at' => now()->toIso8601String(),
        ], now()->addDays(90));

        return response()->json([
            'success' => true,
            'message' => 'Abonnement Push PWA activé avec succès.',
            'push_subscribed' => true,
        ]);
    }

    /**
     * Désactiver l'abonnement PWA WebPush pour l'utilisateur connecté.
     */
    public function unsubscribePush(Request $request): JsonResponse
    {
        $user = $request->user();
        Cache::forget("pwa_push:subscriptions:{$user->id}");

        return response()->json([
            'success' => true,
            'message' => 'Abonnement Push PWA désactivé.',
            'push_subscribed' => false,
        ]);
    }

    /**
     * Diffuser une alerte urgente ou ciblée (par Année d'études, Semestre, Filière, Groupe, Département, ou Global).
     */
    public function broadcastUrgentAlert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'target_type' => 'required|string|in:all,students,professors,filiere,academic_year_level,semester,group,department',
            'target_id' => 'nullable|integer',
            'filiere_id' => 'nullable|integer',
            'year_level' => 'nullable|integer|between:1,5',
            'semester_number' => 'nullable|integer|between:1,10',
            'urgency' => 'nullable|string|in:normal,urgent,critical',
            'send_channels' => 'nullable|array',
        ]);

        $channels = $validated['send_channels'] ?? ['push', 'system'];
        $targetType = $validated['target_type'];
        $targetId = $validated['target_id'] ?? null;
        $filiereId = $validated['filiere_id'] ?? null;
        $yearLevel = $validated['year_level'] ?? null;
        $semNum = $validated['semester_number'] ?? null;
        $urgency = $validated['urgency'] ?? 'urgent';

        // Déterminer les utilisateurs cibles
        $targetUsers = collect();
        $targetLabel = 'Tous';

        if ($targetType === 'all') {
            $targetUsers = User::where('is_active', true)->get();
            $targetLabel = 'Tous ('.$targetUsers->count().' utilisateurs)';
        } elseif ($targetType === 'students') {
            $targetUsers = User::role('student')->where('is_active', true)->get();
            $targetLabel = 'Tous les Étudiants ('.$targetUsers->count().')';
        } elseif ($targetType === 'professors') {
            $targetUsers = User::role('professor')->where('is_active', true)->get();
            $targetLabel = 'Tous les Enseignants ('.$targetUsers->count().')';
        } elseif ($targetType === 'academic_year_level' && $yearLevel) {
            $semesters = [($yearLevel * 2) - 1, $yearLevel * 2];
            $query = StudentRegistration::whereIn('semester_number', $semesters);
            if ($filiereId) {
                $query->where('filiere_id', $filiereId);
            }
            $studentIds = $query->pluck('student_id');
            $userIds = Student::whereIn('id', $studentIds)->pluck('user_id');
            $targetUsers = User::whereIn('id', $userIds)->where('is_active', true)->get();
            $filiereObj = $filiereId ? Filiere::find($filiereId) : null;
            $filiereStr = $filiereObj ? " • {$filiereObj->code}" : '';
            $yearLabels = [1 => '1ère Année', 2 => '2ème Année', 3 => '3ème Année', 4 => '4ème Année', 5 => '5ème Année'];
            $targetLabel = ($yearLabels[$yearLevel] ?? "Année {$yearLevel}")." (S{$semesters[0]}/S{$semesters[1]}{$filiereStr}) ({$targetUsers->count()} étudiants)";
        } elseif ($targetType === 'semester' && $semNum) {
            $query = StudentRegistration::where('semester_number', $semNum);
            if ($filiereId) {
                $query->where('filiere_id', $filiereId);
            }
            $studentIds = $query->pluck('student_id');
            $userIds = Student::whereIn('id', $studentIds)->pluck('user_id');
            $targetUsers = User::whereIn('id', $userIds)->where('is_active', true)->get();
            $filiereObj = $filiereId ? Filiere::find($filiereId) : null;
            $filiereStr = $filiereObj ? " • {$filiereObj->code}" : '';
            $targetLabel = "Semestre S{$semNum}{$filiereStr} ({$targetUsers->count()} étudiants)";
        } elseif ($targetType === 'filiere' && ($targetId || $filiereId)) {
            $fId = $targetId ?: $filiereId;
            $filiere = Filiere::find($fId);
            $query = StudentRegistration::where('filiere_id', $fId);
            if ($semNum) {
                $query->where('semester_number', $semNum);
            }
            $studentIds = $query->pluck('student_id');
            $userIds = Student::whereIn('id', $studentIds)->pluck('user_id');
            $targetUsers = User::whereIn('id', $userIds)->where('is_active', true)->get();
            $semStr = $semNum ? " (Semestre S{$semNum})" : '';
            $targetLabel = 'Filière '.($filiere ? $filiere->code.' - '.$filiere->name : '#'.$fId)."{$semStr} ({$targetUsers->count()} étudiants)";
        } elseif ($targetType === 'group' && $targetId) {
            $group = Group::find($targetId);
            $studentIds = StudentRegistration::where('group_id', $targetId)->pluck('student_id');
            $userIds = Student::whereIn('id', $studentIds)->pluck('user_id');
            $targetUsers = User::whereIn('id', $userIds)->where('is_active', true)->get();
            $targetLabel = 'Groupe '.($group ? $group->name : '#'.$targetId).' ('.$targetUsers->count().' étudiants)';
        } elseif ($targetType === 'department' && $targetId) {
            $dept = Department::find($targetId);
            $userIds = Professor::where('department_id', $targetId)->pluck('user_id');
            $targetUsers = User::whereIn('id', $userIds)->where('is_active', true)->get();
            $targetLabel = 'Département '.($dept ? $dept->name : '#'.$targetId).' ('.$targetUsers->count().' enseignants)';
        }

        // Notification Système & Push PWA pour chaque utilisateur concerné
        if ((in_array('system', $channels, true) || in_array('push', $channels, true)) && $targetUsers->isNotEmpty()) {
            $notificationType = $urgency === 'critical' ? 'danger' : ($urgency === 'urgent' ? 'warning' : 'info');
            foreach ($targetUsers as $targetUser) {
                try {
                    $targetUser->notify(new SystemNotification($validated['title'], $validated['message'], $notificationType));
                    Cache::forget($this->unreadCountCacheKey($targetUser->id));
                } catch (\Throwable) {
                    // Fail gracefully
                }
            }
        }

        $log = NotificationLog::create([
            'user_id' => $request->user()?->id,
            'type' => implode(',', $channels),
            'recipient' => $targetLabel,
            'message' => $validated['title'].' — '.$validated['message'],
            'status' => 'sent',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alerte ciblée diffusée avec succès auprès de '.$targetUsers->count().' destinataires.',
            'broadcast_id' => $log->id,
            'recipients_count' => $targetUsers->count(),
            'target_label' => $targetLabel,
            'channels' => $channels,
        ]);
    }

    /**
     * Obtenir les statistiques et listes de ciblage (Années, Semestres, Filières, Groupes, Départements)
     * avec agrégation SQL unique (anti N+1) et mise en cache Redis haute concurrence.
     */
    public function getPwaStats(Request $request): JsonResponse
    {
        $targetingData = Cache::remember('pwa_hub:targeting_stats', 300, function () {
            $studentsCount = Student::count();
            $professorsCount = Professor::count();
            $totalUsers = User::count();

            // Agrégation unique par semestre au lieu de 15 requêtes COUNT séparées
            $semesterCounts = StudentRegistration::query()
                ->selectRaw('semester_number, COUNT(*) as aggregate')
                ->groupBy('semester_number')
                ->pluck('aggregate', 'semester_number');

            $countForSemesters = fn (array $nums): int => array_sum(
                array_map(fn (int $s) => (int) ($semesterCounts[$s] ?? 0), $nums)
            );

            // Répartition par Année d'études (1ère à 5ème Année ENCG)
            $yearLevels = [
                [
                    'level' => 1,
                    'name' => '1ère Année (Tronc Commun S1/S2)',
                    'semesters' => [1, 2],
                    'count' => $countForSemesters([1, 2]),
                ],
                [
                    'level' => 2,
                    'name' => '2ème Année (Tronc Commun S3/S4)',
                    'semesters' => [3, 4],
                    'count' => $countForSemesters([3, 4]),
                ],
                [
                    'level' => 3,
                    'name' => '3ème Année (Gestion & Commerce S5/S6)',
                    'semesters' => [5, 6],
                    'count' => $countForSemesters([5, 6]),
                ],
                [
                    'level' => 4,
                    'name' => '4ème Année (Spécialités Master S7/S8)',
                    'semesters' => [7, 8],
                    'count' => $countForSemesters([7, 8]),
                ],
                [
                    'level' => 5,
                    'name' => '5ème Année (Diplomation & PFE S9/S10)',
                    'semesters' => [9, 10],
                    'count' => $countForSemesters([9, 10]),
                ],
            ];

            // Répartition par Semestre individuel (S1 à S10)
            $semestersList = [];
            for ($i = 1; $i <= 10; $i++) {
                $semestersList[] = [
                    'semester_number' => $i,
                    'code' => "S{$i}",
                    'name' => "Semestre {$i}",
                    'count' => (int) ($semesterCounts[$i] ?? 0),
                ];
            }

            $filieres = Filiere::withCount('studentRegistrations')->get()->map(fn ($f) => [
                'id' => $f->id,
                'code' => $f->code,
                'name' => $f->name,
                'students_count' => $f->student_registrations_count ?? 0,
            ])->all();

            $groups = Group::with('filiere')->withCount('studentRegistrations')->get()->map(fn ($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'filiere_id' => $g->filiere_id,
                'filiere_code' => $g->filiere?->code ?? '',
                'students_count' => $g->student_registrations_count ?? 0,
            ])->all();

            $departments = Department::withCount('professors')->get()->map(fn ($d) => [
                'id' => $d->id,
                'code' => $d->code,
                'name' => $d->name,
                'professors_count' => $d->professors_count ?? 0,
            ])->all();

            return [
                'students_count' => $studentsCount,
                'professors_count' => $professorsCount,
                'total_users' => $totalUsers,
                'year_levels' => $yearLevels,
                'semesters' => $semestersList,
                'filieres' => $filieres,
                'groups' => $groups,
                'departments' => $departments,
            ];
        });

        $totalLogs = NotificationLog::count();
        $recentLogs = NotificationLog::latest()->take(15)->get()->map(function ($log) {
            $parts = explode(' — ', (string) $log->message, 2);

            return [
                'id' => $log->id,
                'title' => $log->title ?? ($parts[0] ?: 'Notification Campus'),
                'message' => isset($parts[1]) ? $parts[1] : $log->message,
                'recipient_type' => $log->recipient_type ?? $log->recipient,
                'channel' => $log->channel ?? $log->type,
                'status' => $log->status,
                'sent_at' => $log->sent_at?->format('d/m/Y H:i') ?? $log->created_at?->format('d/m/Y H:i'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => array_merge($targetingData, [
                'total_broadcasts' => $totalLogs,
                'recent_logs' => $recentLogs,
            ]),
        ]);
    }
}
