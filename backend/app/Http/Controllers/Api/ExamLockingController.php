<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ExamLockingAudit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\SystemNotification;

class ExamLockingController extends Controller
{
    /**
     * Get current locking status and audit history
     */
    public function index()
    {
        $institution = \App\Models\Institution::first();
        $settings = [];
        if ($institution) {
            $settings = is_array($institution->settings) 
                ? $institution->settings 
                : (is_string($institution->settings) ? json_decode($institution->settings, true) : []);
        }
        $currentPhase = $settings['exam_lock_phase'] ?? 'Verrouillé';
        
        $audits = ExamLockingAudit::latest()->take(20)->get()->map(function($audit) {
            return [
                'id' => $audit->id,
                'date' => $audit->created_at ? $audit->created_at->format('d/m/Y H:i:s') : date('d/m/Y H:i:s'),
                'user' => $audit->user_name,
                'oldPhase' => $audit->old_phase,
                'newPhase' => $audit->new_phase,
                'ip' => $audit->ip_address,
                'isRed' => $audit->new_phase === 'Verrouillage Total' || $audit->new_phase === 'Verrouillé',
            ];
        });

        return response()->json([
            'current_phase' => $currentPhase,
            'audits' => $audits
        ]);
    }

    /**
     * Change locking phase
     */
    public function updateStatus(Request $request)
    {
        $request->validate([
            'new_phase' => 'required|string',
        ]);

        $institution = \App\Models\Institution::first();
        if (! $institution) {
            $institution = \App\Models\Institution::create([
                'name' => 'ENCG Fès',
                'code' => 'ENCG-FES',
                'settings' => ['exam_lock_phase' => 'Verrouillé'],
            ]);
        }

        $settings = is_array($institution->settings) 
            ? $institution->settings 
            : (is_string($institution->settings) ? json_decode($institution->settings, true) : []);

        $oldPhase = $settings['exam_lock_phase'] ?? 'Verrouillé';
        $newPhase = $request->new_phase;

        if ($oldPhase !== $newPhase) {
            $settings['exam_lock_phase'] = $newPhase;
            $institution->update(['settings' => $settings]);

            $user = $request->user();
            ExamLockingAudit::create([
                'user_id' => $user ? $user->id : null,
                'user_name' => $user ? $user->name : 'Système',
                'old_phase' => $oldPhase,
                'new_phase' => $newPhase,
                'ip_address' => $request->ip(),
            ]);

            // ⚖️ JURY DELIBERATION
            if ($newPhase === 'Verrouillé' || $newPhase === 'Verrouillage Total') {
                $deliberationService = new \App\Services\Academic\DeliberationService();
                $modules = \App\Models\Module::all();
                
                // Try to find the active exam session
                $session = \Illuminate\Support\Facades\DB::table('exam_sessions')
                    ->where('status', 'active')
                    ->latest('id')
                    ->first();
                $sessionId = $session ? $session->id : null;

                foreach ($modules as $module) {
                    try {
                        $deliberationService->processModuleDeliberation($module->id, $sessionId);
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error("Failed to deliberate module {$module->id}: " . $e->getMessage());
                    }
                }
            }

            // Notify all professors about the phase change
            $professors = \App\Models\User::whereHas('roles', fn($q) => $q->whereIn('name', ['professor', 'vacataire']))->get();
            if ($professors->isNotEmpty()) {
                Notification::send($professors, new SystemNotification(
                    "Changement de phase des notes",
                    "La phase de saisie des notes est passée à : {$newPhase}.",
                    "system",
                    "/professor/grades"
                ));

                // Send email alerts in the background / try-catch
                try {
                    $emails = $professors->pluck('email')->filter()->toArray();
                    if (!empty($emails)) {
                        foreach ($emails as $email) {
                            \Illuminate\Support\Facades\Mail::to($email)->send(new \App\Mail\GradePhaseUpdatedMail($newPhase));
                        }
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send phase update emails: " . $e->getMessage());
                }
            }
            
            // Broadcast via Reverb
            event(new \App\Events\GradeEntryPeriodChanged($newPhase));
        }

        return $this->index();
    }
}
