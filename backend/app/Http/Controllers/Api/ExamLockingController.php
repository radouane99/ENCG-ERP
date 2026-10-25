<?php

namespace App\Http\Controllers\Api;

use App\Events\GradeEntryPeriodChanged;
use App\Http\Controllers\Controller;
use App\Mail\GradePhaseUpdatedMail;
use App\Models\ExamLockingAudit;
use App\Models\Institution;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Services\Academic\DeliberationService;
use App\Services\Academic\ExamWorkflowGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

class ExamLockingController extends Controller
{
    public function __construct(
        private DeliberationService $deliberationService
    ) {}

    /**
     * Statut actuel et historique.
     */
    public function index(): JsonResponse
    {
        $institution = Institution::findOrFail(auth()->user()->institution_id);
        $settings = $institution ? (is_array($institution->settings) ? $institution->settings : (is_string($institution->settings) ? json_decode($institution->settings, true) : [])) : [];

        $currentPhase = $settings['exam_lock_phase'] ?? 'Verrouillé';
        $deadline = $settings['exam_lock_deadline'] ?? null;

        $audits = ExamLockingAudit::latest()->take(20)->get()->map(fn ($audit) => [
            'id' => $audit->id,
            'date' => $audit->created_at?->format('d/m/Y H:i:s') ?? date('d/m/Y H:i:s'),
            'user' => $audit->user_name,
            'oldPhase' => $audit->old_phase,
            'newPhase' => $audit->new_phase,
            'reason' => $audit->reason ?? 'Non précisé',
            'ip' => $audit->ip_address,
            'isRed' => in_array($audit->new_phase, ['Verrouillage Total', 'Verrouillé']),
        ]);

        return response()->json([
            'success' => true,
            'current_phase' => $currentPhase,
            'deadline' => $deadline,
            'audits' => $audits,
        ]);
    }

    /**
     * Changer la phase de verrouillage.
     */
    public function updateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'new_phase' => 'required|string|in:Ordinaire Automne,Rattrapage Automne,Ordinaire Printemps,Rattrapage Printemps,Verrouillé,Verrouillage Total',
            'deadline' => 'nullable|date',
            'reason' => 'required|string|min:5|max:2000',
        ]);

        app(ExamWorkflowGuard::class)->manage();
        $institution = Institution::findOrFail($request->user()->institution_id);

        $settings = is_array($institution->settings) ? $institution->settings : (is_string($institution->settings) ? json_decode($institution->settings, true) : []);

        $oldPhase = $settings['exam_lock_phase'] ?? 'Verrouillé';
        $newPhase = $request->new_phase;
        $deadline = $request->input('deadline');
        $reason = $request->input('reason', 'Changement de phase');

        if ($oldPhase !== $newPhase || $deadline !== null) {
            $settings['exam_lock_phase'] = $newPhase;
            if ($request->exists('deadline')) {
                $settings['exam_lock_deadline'] = $deadline;
            }
            $institution->update(['settings' => $settings]);

            $user = $request->user();
            ExamLockingAudit::create([
                'user_id' => $user?->id,
                'user_name' => $user?->name ?? $user?->email ?? 'Système',
                'old_phase' => $oldPhase,
                'new_phase' => $newPhase,
                'reason' => $reason,
                'ip_address' => $request->ip(),
            ]);

            // Closing grade entry never runs a jury or changes academic decisions.
            // Deliberation remains an explicit, scoped and audited workflow.

            // Notifier les professeurs
            $professors = User::where('institution_id', $institution->id)->whereHas('roles', fn ($q) => $q->whereIn('name', ['professor', 'vacataire']))->get();

            if ($professors->isNotEmpty()) {
                Notification::send($professors, new SystemNotification(
                    'Changement de phase des notes',
                    "La phase de saisie des notes est passée à : {$newPhase}.",
                    'system',
                    '/professor/grades'
                ));

                try {
                    foreach ($professors as $prof) {
                        if ($prof->email) {
                            Mail::to($prof->email)->send(new GradePhaseUpdatedMail($newPhase));
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Échec envoi emails de phase: '.$e->getMessage());
                }
            }

            event(new GradeEntryPeriodChanged($newPhase));
        }

        return $this->index();
    }
}
