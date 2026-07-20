<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ScheduleChangeRequest;

class ScheduleChangeRequestController extends Controller
{
    public function index(): JsonResponse
    {
        $requests = ScheduleChangeRequest::with(['professor.professor.department', 'exam.module'])->get()->map(function ($req) {
            return [
                'id' => $req->id,
                'professor_name' => $req->professor->name ?? 'Inconnu',
                'department' => $req->professor->professor->department->name ?? 'Génie Informatique', // Use real dept or fallback
                'module_name' => $req->exam->module->name ?? 'N/A',
                'old_date' => $req->old_date ? $req->old_date->format('d/m/Y') : 'N/A',
                'old_start_time' => $req->old_start_time ? substr($req->old_start_time, 0, 5) : 'N/A',
                'proposed_date' => $req->proposed_date->format('d/m/Y'),
                'proposed_start_time' => substr($req->proposed_start_time, 0, 5),
                'reason' => $req->reason,
                'status' => $req->status,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected'
        ]);

        $changeRequest = ScheduleChangeRequest::findOrFail($id);
        $changeRequest->status = $validated['status'];
        $changeRequest->save();

        if ($validated['status'] === 'approved') {
            if ($changeRequest->exam_id) {
                $exam = $changeRequest->exam;
                $exam->exam_date = $changeRequest->proposed_date;
                $exam->start_time = $changeRequest->proposed_start_time;
                $exam->save();
            }

            // Send notification via Resend
            $email = $changeRequest->professor?->user?->email ?? $changeRequest->professor?->email;
            if ($email) {
                $changeData = [
                    'moduleName' => $changeRequest->exam?->module?->name ?? 'Module d\'Enseignement',
                    'professorName' => $changeRequest->professor?->name ?? 'Enseignant ENCG',
                    'newDate' => $changeRequest->proposed_date ? $changeRequest->proposed_date->format('d/m/Y') : 'À déterminer',
                    'newStartTime' => substr($changeRequest->proposed_start_time, 0, 5),
                    'newEndTime' => '10:30',
                    'roomName' => 'Salle d\'Examen / Amphi',
                    'reason' => $changeRequest->reason
                ];

                try {
                    \Illuminate\Support\Facades\Mail::to($email)->send(new \App\Mail\ScheduleChangeNotificationMail($changeData));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send schedule change mail to {$email}: " . $e->getMessage());
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Demande ' . ($validated['status'] === 'approved' ? 'approuvée (notifiée par e-mail)' : 'rejetée') . ' avec succès.'
        ]);
    }

    /**
     * Suggest available professors in the same department for substitution.
     */
    public function suggestSubstitutes(Request $request): JsonResponse
    {
        $departmentId = $request->query('department_id');
        
        $professors = \App\Models\Professor::with('user')
            ->when($departmentId, fn($q) => $q->where('department_id', $departmentId))
            ->take(5)
            ->get()
            ->map(function ($prof) {
                return [
                    'id' => $prof->id,
                    'name' => $prof->user ? $prof->user->name : "{$prof->first_name} {$prof->last_name}",
                    'specialty' => $prof->specialty ?? 'Management / Finance',
                    'available' => true,
                    'contact' => $prof->email ?? 'N/A'
                ];
            });

        return response()->json([
            'success' => true,
            'substitutes' => $professors
        ]);
    }
}
