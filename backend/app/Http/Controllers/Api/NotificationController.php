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

class NotificationController extends Controller
{
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
            $unreadCount = $user->unreadNotifications()->count();

            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'meta' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'unread_count' => $unreadCount,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => true,
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 15, 'total' => 0, 'unread_count' => 0],
            ]);
        }
    }

    /**
     * Marquer une notification comme lue.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);

        if (! $notification) {
            return response()->json(['success' => false, 'message' => 'Notification introuvable.'], 404);
        }

        $notification->markAsRead();

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
        $request->user()->unreadNotifications->markAsRead();

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
        $notification = $request->user()->notifications()->find($id);

        if (! $notification) {
            return response()->json(['success' => false, 'message' => 'Notification introuvable.'], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée.',
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

        // Notification Système (In-App) pour chaque utilisateur concerné
        if (in_array('system', $channels) && $targetUsers->isNotEmpty()) {
            $notificationType = $urgency === 'critical' ? 'danger' : ($urgency === 'urgent' ? 'warning' : 'info');
            foreach ($targetUsers as $targetUser) {
                try {
                    $targetUser->notify(new SystemNotification($validated['title'], $validated['message'], $notificationType));
                } catch (\Throwable) {
                    // Fail gracefully
                }
            }
        }

        $log = NotificationLog::create([
            'title' => $validated['title'],
            'message' => $validated['message'],
            'recipient_type' => $targetLabel,
            'channel' => implode(',', $channels),
            'status' => 'sent',
            'sent_at' => now(),
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
     * Obtenir les statistiques et listes de ciblage (Années, Semestres, Filières, Groupes, Départements).
     */
    public function getPwaStats(Request $request): JsonResponse
    {
        $studentsCount = Student::count();
        $professorsCount = Professor::count();
        $totalUsers = User::count();
        $totalLogs = NotificationLog::count();

        // Répartition par Année d'études (1ère à 5ème Année ENCG)
        $yearLevels = [
            [
                'level' => 1,
                'name' => '1ère Année (Tronc Commun S1/S2)',
                'semesters' => [1, 2],
                'count' => StudentRegistration::whereIn('semester_number', [1, 2])->count(),
            ],
            [
                'level' => 2,
                'name' => '2ème Année (Tronc Commun S3/S4)',
                'semesters' => [3, 4],
                'count' => StudentRegistration::whereIn('semester_number', [3, 4])->count(),
            ],
            [
                'level' => 3,
                'name' => '3ème Année (Gestion & Commerce S5/S6)',
                'semesters' => [5, 6],
                'count' => StudentRegistration::whereIn('semester_number', [5, 6])->count(),
            ],
            [
                'level' => 4,
                'name' => '4ème Année (Spécialités Master S7/S8)',
                'semesters' => [7, 8],
                'count' => StudentRegistration::whereIn('semester_number', [7, 8])->count(),
            ],
            [
                'level' => 5,
                'name' => '5ème Année (Diplomation & PFE S9/S10)',
                'semesters' => [9, 10],
                'count' => StudentRegistration::whereIn('semester_number', [9, 10])->count(),
            ],
        ];

        // Répartition par Semestre individuel (S1 à S10)
        $semestersList = [];
        for ($i = 1; $i <= 10; $i++) {
            $semestersList[] = [
                'semester_number' => $i,
                'code' => "S{$i}",
                'name' => "Semestre {$i}",
                'count' => StudentRegistration::where('semester_number', $i)->count(),
            ];
        }

        $filieres = Filiere::withCount('studentRegistrations')->get()->map(fn ($f) => [
            'id' => $f->id,
            'code' => $f->code,
            'name' => $f->name,
            'students_count' => $f->student_registrations_count,
        ]);

        $groups = Group::with('filiere')->withCount('studentRegistrations')->get()->map(fn ($g) => [
            'id' => $g->id,
            'name' => $g->name,
            'filiere_id' => $g->filiere_id,
            'filiere_code' => $g->filiere?->code ?? '',
            'students_count' => $g->student_registrations_count,
        ]);

        $departments = Department::withCount('professors')->get()->map(fn ($d) => [
            'id' => $d->id,
            'code' => $d->code,
            'name' => $d->name,
            'professors_count' => $d->professors_count,
        ]);

        $recentLogs = NotificationLog::latest()->take(15)->get()->map(fn ($log) => [
            'id' => $log->id,
            'title' => $log->title,
            'message' => $log->message,
            'recipient_type' => $log->recipient_type,
            'channel' => $log->channel,
            'status' => $log->status,
            'sent_at' => $log->sent_at?->format('d/m/Y H:i') ?? $log->created_at?->format('d/m/Y H:i'),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'students_count' => $studentsCount,
                'professors_count' => $professorsCount,
                'total_users' => $totalUsers,
                'total_broadcasts' => $totalLogs,
                'year_levels' => $yearLevels,
                'semesters' => $semestersList,
                'filieres' => $filieres,
                'groups' => $groups,
                'departments' => $departments,
                'recent_logs' => $recentLogs,
            ],
        ]);
    }
}
