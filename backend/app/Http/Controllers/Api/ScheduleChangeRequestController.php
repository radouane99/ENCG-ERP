<?php

namespace App\Http\Controllers\Api;

use App\Actions\Academic\RequestTimetableChangeAction;
use App\Actions\Academic\ReviewTimetableChangeAction;
use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Professor;
use App\Models\Schedule;
use App\Models\ScheduleChangeRequest;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Support\InternshipAccess;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleChangeRequestController extends Controller
{
    private function isStaff(): bool
    {
        return request()->user()->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'department-head', 'filiere-head', 'scolarite']);
    }

    public function storeTimetable(Request $request): JsonResponse
    {
        abort_unless($request->user()->professor || $request->user()->hasAnyRole(['professor', 'vacataire']), 403);
        $data = $request->validate(['schedule_id' => 'required|integer', 'reason' => 'required|string|min:10|max:2000', 'day_of_week' => 'required|integer|min:1|max:5', 'start_time' => 'required|date_format:H:i|after_or_equal:08:30', 'end_time' => 'required|date_format:H:i|before_or_equal:18:45']);
        $record = app(RequestTimetableChangeAction::class)->execute($request->user(), $data);

        return response()->json(['success' => true, 'message' => 'Demande transmise. Le planning reste inchangé avant décision administrative.', 'data' => $record], 201);
    }

    /**
     * Liste des demandes de changement.
     */
    public function index(): JsonResponse
    {
        $requests = ScheduleChangeRequest::whereHas('professor', fn ($q) => $q->where('institution_id', request()->user()->institution_id))->when(! $this->isStaff(), fn ($q) => $q->where('professor_id', request()->user()->id))->with(['professor.professor.department', 'exam.module', 'schedule.module'])->latest()->limit(200)
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'professor_name' => $req->professor->name ?? 'Inconnu',
                    'department' => $req->professor->professor?->department?->name ?? 'Inconnu',
                    'module_name' => $req->schedule?->module?->name ?? $req->exam?->module?->name ?? 'Rapport de conflits',
                    'request_type' => $req->request_type,
                    'schedule_id' => $req->schedule_id,
                    'timetable_payload' => $req->timetable_payload,
                    'review_note' => $req->review_note,
                    'old_date' => $req->request_type === 'timetable_change' ? (['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'][$req->timetable_payload['original']['day_of_week']] ?? '—') : ($req->old_date?->format('d/m/Y') ?? 'N/A'),
                    'old_start_time' => $req->old_start_time ? substr($req->old_start_time, 0, 5) : 'N/A',
                    'proposed_date' => $req->request_type === 'timetable_change' ? (['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'][$req->timetable_payload['proposed']['day_of_week']] ?? '—') : $req->proposed_date?->format('d/m/Y'),
                    'proposed_start_time' => $req->proposed_start_time ? substr($req->proposed_start_time, 0, 5) : 'N/A',
                    'reason' => $req->reason,
                    'status' => $req->status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Enregistrement d'un rapport groupé de conflits d'horaires transmis par un enseignant.
     */
    public function storeBatchReport(Request $request): JsonResponse
    {
        $data = $request->validate(['summary' => 'required|string|min:10|max:10000', 'total_count' => 'required|integer|min:1|max:10000']);
        abort_unless($request->user()->professor || InternshipAccess::staff($request->user()), 403);
        $record = ScheduleChangeRequest::create(['professor_id' => $request->user()->id, 'request_type' => 'conflict_report', 'reason' => 'Rapport de '.$data['total_count'].' conflit(s) : '.$data['summary'], 'status' => 'pending']);
        activity()->causedBy($request->user())->performedOn($record)->log('schedule_conflicts_reported');

        return response()->json(['success' => true, 'message' => 'Rapport enregistré pour examen par le service des emplois du temps.', 'data' => $record], 201);
    }

    /**
     * Approuver ou rejeter une demande.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        abort_unless($this->isStaff(), 403);
        $data = $request->validate(['status' => 'required|in:approved,rejected']);
        $change = ScheduleChangeRequest::whereHas('professor', fn ($q) => $q->where('institution_id', $request->user()->institution_id))->findOrFail($id);
        if ($change->request_type === 'timetable_change') {
            $review = $request->validate(['review_note' => 'required|string|min:10|max:2000']);
            app(ReviewTimetableChangeAction::class)->execute($request->user(), $change, $data['status'], $review['review_note']);

            return response()->json(['success' => true, 'message' => $data['status'] === 'approved' ? 'Changement contrôlé et appliqué au planning.' : 'Demande refusée. Planning conservé.']);
        }
        DB::transaction(function () use ($request, $id, $data) {
            $change = ScheduleChangeRequest::whereHas('professor', fn ($q) => $q->where('institution_id', $request->user()->institution_id))->whereKey($id)->lockForUpdate()->firstOrFail();
            abort_unless($change->status === 'pending', 409, 'Demande déjà traitée.');
            if ($data['status'] === 'approved' && $change->exam_id) {
                $exam = Exam::whereKey($change->exam_id)->lockForUpdate()->firstOrFail();
                abort_unless($change->proposed_date && $change->proposed_start_time && $exam->exam_date?->format('Y-m-d') === Carbon::parse($change->proposed_date)->format('Y-m-d') && substr($exam->start_time, 0, 5) === substr($change->proposed_start_time, 0, 5), 422, 'Replanifiez l’examen dans le module Examens avec contrôle des conflits avant de clôturer cette demande.');
            }
            $change->update(['status' => $data['status']]);
            $change->professor->notifyNow(new SystemNotification('Suivi de votre demande d’horaire', 'Votre demande a été '.($data['status'] === 'approved' ? 'acceptée pour traitement' : 'rejetée').'. Consultez le service des emplois du temps.', 'info', '/professor/schedule'), ['database']);
            activity()->causedBy($request->user())->performedOn($change)->log('schedule_change_reviewed');
        });

        return response()->json(['success' => true, 'message' => 'Décision enregistrée et notification déposée dans l’espace enseignant.']);
    }

    /**
     * Suggérer des professeurs remplaçants.
     */
    public function suggestSubstitutes(Request $request): JsonResponse
    {
        $departmentId = $request->query('department_id');

        $professors = Professor::with('user')
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->take(5)
            ->get()
            ->map(fn ($prof) => [
                'id' => $prof->id,
                'name' => $prof->user?->name ?? "{$prof->first_name} {$prof->last_name}",
                'specialty' => $prof->specialty ?? 'Non défini',
                'available' => true,
                'contact' => $prof->email ?? 'N/A',
            ]);

        return response()->json([
            'success' => true,
            'substitutes' => $professors,
        ]);
    }

    /**
     * Proposer une permutation de séance "Peer-to-Peer" entre deux professeurs sans conflit de salle ni de groupe.
     */
    public function proposePeerSwap(Request $request): JsonResponse
    {
        abort_unless($request->user()->professor || $request->user()->hasAnyRole(['professor', 'vacataire']), 403);

        $validated = $request->validate([
            'source_schedule_id' => 'required|integer|exists:schedules,id',
            'target_schedule_id' => 'required|integer|exists:schedules,id|different:source_schedule_id',
            'reason' => 'required|string|min:10|max:1000',
        ]);

        $source = Schedule::with(['module', 'room', 'group'])->findOrFail($validated['source_schedule_id']);
        $target = Schedule::with(['module', 'room', 'group'])->findOrFail($validated['target_schedule_id']);

        $targetProfUserId = $target->professor_type === User::class
            ? $target->professor_id
            : Professor::find($target->professor_id)?->user_id;

        $record = ScheduleChangeRequest::create([
            'professor_id' => $request->user()->id,
            'schedule_id' => $source->id,
            'request_type' => 'peer_swap',
            'reason' => $validated['reason'],
            'status' => 'pending_peer',
            'timetable_payload' => [
                'source_schedule_id' => $source->id,
                'target_schedule_id' => $target->id,
                'target_professor_user_id' => $targetProfUserId,
                'source_slot' => [
                    'day_of_week' => $source->day_of_week,
                    'start_time' => $source->start_time,
                    'end_time' => $source->end_time,
                    'room_id' => $source->room_id,
                ],
                'target_slot' => [
                    'day_of_week' => $target->day_of_week,
                    'start_time' => $target->start_time,
                    'end_time' => $target->end_time,
                    'room_id' => $target->room_id,
                ],
            ],
        ]);

        if ($targetProfUserId && ($peerUser = User::find($targetProfUserId))) {
            $peerUser->notifyNow(new SystemNotification(
                'Proposition de Permutation de Séance (Peer-to-Peer)',
                "Votre collègue {$request->user()->name} propose d'échanger sa séance ({$source->module?->name}) avec la vôtre ({$target->module?->name}).",
                'info',
                '/professor/schedule'
            ), ['database']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Proposition de permutation transmise à votre collègue.',
            'data' => $record,
        ], 201);
    }

    /**
     * Accepter et exécuter atomiquement la permutation "Peer-to-Peer" entre deux créneaux.
     */
    public function acceptPeerSwap(Request $request, int $id): JsonResponse
    {
        $change = ScheduleChangeRequest::findOrFail($id);
        abort_unless($change->request_type === 'peer_swap', 422, 'Cette demande n\'est pas une permutation Peer-to-Peer.');
        abort_unless(in_array($change->status, ['pending_peer', 'pending'], true), 409, 'Cette permutation a déjà été traitée.');

        $payload = $change->timetable_payload ?? [];
        $targetUserId = $payload['target_professor_user_id'] ?? null;

        abort_unless(
            $this->isStaff() || ($targetUserId && (int) $request->user()->id === (int) $targetUserId),
            403,
            'Seul le professeur destinataire ou la Direction des Études peut valider cette permutation.'
        );

        DB::transaction(function () use ($change, $payload, $request) {
            $source = Schedule::whereKey($payload['source_schedule_id'])->lockForUpdate()->firstOrFail();
            $target = Schedule::whereKey($payload['target_schedule_id'])->lockForUpdate()->firstOrFail();

            $sourceSlot = [
                'day_of_week' => $source->day_of_week,
                'start_time' => $source->start_time,
                'end_time' => $source->end_time,
                'room_id' => $source->room_id,
            ];

            $source->update([
                'day_of_week' => $target->day_of_week,
                'start_time' => $target->start_time,
                'end_time' => $target->end_time,
                'room_id' => $target->room_id,
            ]);

            $target->update($sourceSlot);

            $change->update([
                'status' => 'approved',
                'review_note' => 'Permutation Peer-to-Peer validée par '.$request->user()->name,
                'reviewed_at' => now(),
            ]);

            if ($change->professor) {
                $change->professor->notifyNow(new SystemNotification(
                    'Permutation de Séance Confirmée',
                    "La permutation de créneau avec {$request->user()->name} a été validée et appliquée à l'emploi du temps.",
                    'success',
                    '/professor/schedule'
                ), ['database']);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Permutation Peer-to-Peer exécutée avec succès sans conflit.',
        ]);
    }
}
