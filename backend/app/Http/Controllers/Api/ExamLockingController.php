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
        $currentPhase = DB::table('institutions')->first()->settings['exam_lock_phase'] ?? 'Verrouillé';
        
        $audits = ExamLockingAudit::latest()->take(20)->get()->map(function($audit) {
            return [
                'id' => $audit->id,
                'date' => $audit->created_at->format('d/m/Y H:i:s'),
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
        $settings = $institution->settings ?? [];
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

            // Notify all professors about the phase change
            $professors = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'professeur'))->get();
            if ($professors->isNotEmpty()) {
                Notification::send($professors, new SystemNotification(
                    "Changement de phase des notes",
                    "La phase de saisie des notes est passée à : {$newPhase}.",
                    "system",
                    "/professor/grades"
                ));
            }
        }

        return $this->index();
    }
}
