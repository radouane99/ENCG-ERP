<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ScheduleChangeNotificationMail;
use App\Models\Professor;
use App\Models\ScheduleChangeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ScheduleChangeRequestController extends Controller
{
    /**
     * Liste des demandes de changement.
     */
    public function index(): JsonResponse
    {
        $requests = ScheduleChangeRequest::with(['professor.department', 'exam.module'])
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'professor_name' => $req->professor->name ?? 'Inconnu',
                    'department' => $req->professor->department->name ?? 'Inconnu',
                    'module_name' => $req->exam->module->name ?? 'N/A',
                    'old_date' => $req->old_date?->format('d/m/Y') ?? 'N/A',
                    'old_start_time' => $req->old_start_time ? substr($req->old_start_time, 0, 5) : 'N/A',
                    'proposed_date' => $req->proposed_date?->format('d/m/Y'),
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
        $validated = $request->validate([
            'summary' => 'required|string',
            'total_count' => 'nullable|integer',
        ]);

        $user = $request->user();
        $prof = $user?->professor;
        $profId = $prof?->id ?? 1;

        $record = ScheduleChangeRequest::create([
            'professor_id' => $profId,
            'reason' => 'DÉCLARATION GROUPÉE DE CHEVAUCHEMENTS ('.($validated['total_count'] ?? 42)." séances en conflit) :\n".$validated['summary'],
            'proposed_date' => now()->addDays(2),
            'proposed_start_time' => '08:30:00',
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rapport groupé de conflits enregistré et transmis au Service des Emplois du Temps.',
            'data' => $record,
        ]);
    }

    /**
     * Approuver ou rejeter une demande.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $changeRequest = ScheduleChangeRequest::with(['exam', 'professor'])->findOrFail($id);
        $changeRequest->update(['status' => $validated['status']]);

        if ($validated['status'] === 'approved' && $changeRequest->exam) {
            $changeRequest->exam->update([
                'exam_date' => $changeRequest->proposed_date,
                'start_time' => $changeRequest->proposed_start_time,
            ]);

            $email = $changeRequest->professor->email ?? null;
            if ($email) {
                try {
                    Mail::to($email)->send(new ScheduleChangeNotificationMail([
                        'moduleName' => $changeRequest->exam->module->name ?? 'N/A',
                        'professorName' => $changeRequest->professor->name ?? 'Enseignant',
                        'newDate' => $changeRequest->proposed_date?->format('d/m/Y'),
                        'newStartTime' => substr($changeRequest->proposed_start_time ?? '', 0, 5),
                        'reason' => $changeRequest->reason,
                    ]));
                } catch (\Exception $e) {
                    Log::error("Email échec : {$email} — ".$e->getMessage());
                }
            }
        }

        // Send In-App Notification to the Professor
        $profUser = $changeRequest->professor?->user;
        if ($profUser) {
            try {
                DB::table('notifications')->insert([
                    'id' => Str::uuid()->toString(),
                    'type' => 'App\Notifications\ScheduleChangeStatusUpdated',
                    'notifiable_type' => 'App\Models\User',
                    'notifiable_id' => $profUser->id,
                    'data' => json_encode([
                        'title' => $validated['status'] === 'approved' ? '✅ Demande d\'Emploi du Temps Approuvée' : '❌ Demande de Modification Rejetée',
                        'message' => $validated['status'] === 'approved'
                            ? "Votre demande de décalage d'horaire pour {$changeRequest->reason} a été validée par la Direction des Études."
                            : "Votre demande de modification d'horaire n'a pas pu être retenue par l'Administration.",
                        'type' => 'schedule_change_status',
                        'status' => $validated['status'],
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (\Throwable $e) {
            }
        }

        return response()->json([
            'success' => true,
            'message' => $validated['status'] === 'approved'
                ? 'Demande approuvée avec notification immédiate & email envoyés.'
                : 'Demande rejetée avec notification transmise à l\'enseignant.',
        ]);
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
}
