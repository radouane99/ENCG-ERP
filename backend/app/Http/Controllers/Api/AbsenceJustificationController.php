<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsenceJustification;
use App\Models\AttendanceRecord;
use App\Notifications\SystemNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AbsenceJustificationController extends Controller
{
    /**
     * Liste des justificatifs d'absence.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('students.view'), 403);

        $query = AbsenceJustification::with(['student', 'attendance', 'reviewer']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('student', fn($q) =>
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_number', 'like', "%{$search}%")
            );
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $paginated = $query->latest()->paginate($perPage);

        $items = $paginated->getCollection()->map(fn($j) => [
            'id'               => $j->id,
            'reason'           => $j->reason,
            'description'      => $j->description,
            'document_path'    => $j->document_path,
            'status'           => $j->status ?? 'pending',
            'rejection_reason' => $j->rejection_reason,
            'reviewed_at'      => $j->reviewed_at?->toDateTimeString(),
            'created_at'       => $j->created_at?->format('d/m/Y'),
            'student'          => $j->student ? [
                'id'             => $j->student->id,
                'name'           => $j->student->first_name . ' ' . $j->student->last_name,
                'student_number' => $j->student->student_number,
            ] : null,
            'attendance'       => $j->attendance ? [
                'id'          => $j->attendance->id,
                'module_name' => $j->attendance->module_name,
                'group_name'  => $j->attendance->group_name,
                'type'        => $j->attendance->session_type ?? 'CM',
            ] : null,
            'reviewer'         => $j->reviewer?->name,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
            'stats'   => [
                'pending'  => AbsenceJustification::where('status', 'pending')->count(),
                'approved' => AbsenceJustification::where('status', 'approved')->count(),
                'rejected' => AbsenceJustification::where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Approuver ou rejeter un justificatif.
     */
    public function updateStatus(Request $request, AbsenceJustification $absenceJustification): JsonResponse
    {
        abort_unless($request->user()->can('students.edit'), 403);

        $validated = $request->validate([
            'status'           => 'required|in:approved,rejected',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $absenceJustification->update([
            'status'           => $validated['status'],
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'reviewed_by'      => $request->user()->id,
            'reviewed_at'      => now(),
        ]);

        // Marquer la présence comme justifiée si approuvé
        if ($validated['status'] === 'approved' && $absenceJustification->attendance_id) {
            AttendanceRecord::where('attendance_session_id', $absenceJustification->attendance_id)
                ->where('student_id', $absenceJustification->student_id)
                ->update(['is_justified' => true]);
        }

        // Notifier l'étudiant
        $studentUser = $absenceJustification->student?->user;
        if ($studentUser) {
            $statusText = $validated['status'] === 'approved' ? 'approuvé' : 'rejeté';
            $message = "Votre justificatif d'absence a été {$statusText}.";
            if ($validated['status'] === 'rejected' && !empty($validated['rejection_reason'])) {
                $message .= " Motif : {$validated['rejection_reason']}";
            }
            $studentUser->notify(new SystemNotification(
                "Justificatif {$statusText}",
                $message,
                'academic',
                '/student/absences'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => $validated['status'] === 'approved'
                ? 'Justificatif approuvé avec succès.'
                : 'Justificatif rejeté.',
            'data'    => $absenceJustification->fresh(),
        ]);
    }

    /**
     * Supprimer un justificatif.
     */
    public function destroy(AbsenceJustification $absenceJustification): JsonResponse
    {
        abort_unless(request()->user()->can('students.delete'), 403);

        $absenceJustification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Justificatif supprimé.',
        ]);
    }
}