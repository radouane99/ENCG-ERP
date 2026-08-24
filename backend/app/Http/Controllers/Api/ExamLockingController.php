<?php

namespace App\Http\Controllers\Api;

use App\Events\GradeEntryPeriodChanged;
use App\Http\Controllers\Controller;
use App\Mail\GradePhaseUpdatedMail;
use App\Models\ExamLockingAudit;
use App\Models\ExamSession;
use App\Models\Institution;
use App\Models\Module;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Services\Academic\DeliberationService;
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
        $institution = Institution::first();
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
            'new_phase' => 'required|string',
            'deadline' => 'nullable|string',
            'reason' => 'nullable|string',
        ]);

        $institution = Institution::first() ?? Institution::create([
            'name' => 'ENCG Fès',
            'code' => 'ENCG-FES',
            'settings' => ['exam_lock_phase' => 'Verrouillé'],
        ]);

        $settings = is_array($institution->settings) ? $institution->settings : (is_string($institution->settings) ? json_decode($institution->settings, true) : []);

        $oldPhase = $settings['exam_lock_phase'] ?? 'Verrouillé';
        $newPhase = $request->new_phase;
        $deadline = $request->input('deadline');
        $reason = $request->input('reason', 'Changement de phase');

        if ($oldPhase !== $newPhase || $deadline !== null) {
            $settings['exam_lock_phase'] = $newPhase;
            if ($deadline !== null) {
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

            // Déclencher la délibération si verrouillage
            if (in_array($newPhase, ['Verrouillé', 'Verrouillage Total'])) {
                $modules = Module::all();
                $sessionId = ExamSession::where('status', 'active')->latest('id')->value('id');

                foreach ($modules as $module) {
                    try {
                        $this->deliberationService->processModuleDeliberation($module->id, $sessionId);
                    } catch (\Exception $e) {
                        Log::error("Échec délibération module {$module->id}: ".$e->getMessage());
                    }
                }
            }

            // Notifier les professeurs
            $professors = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['professor', 'vacataire']))->get();

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
