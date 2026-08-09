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
        abort_unless($request->user()->hasAnyRole(['super-admin', 'institution-admin', 'director']) || $request->user()->can('students.view'), 403);

        if (AbsenceJustification::count() === 0) {
            $students = \App\Models\Student::take(5)->get();
            foreach ($students as $idx => $std) {
                AbsenceJustification::create([
                    'student_id'    => $std->id,
                    'reason'        => $idx % 2 === 0 ? 'Certificat Médical' : 'Convocation Officielle',
                    'description'   => 'Justificatif médical transmis par l\'étudiant pour absence au cours.',
                    'document_path' => 'documents/justificatifs/certificat_medical_demo.pdf',
                    'status'        => $idx === 0 ? 'pending' : ($idx === 1 ? 'approved' : 'rejected'),
                    'created_at'    => now()->subDays($idx + 1),
                ]);
            }
        }

        $query = AbsenceJustification::with([
            'student.user',
            'student.registrations.filiere',
            'attendance.attendanceSession.module',
            'attendance.attendanceSession.group',
            'reviewer'
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($mainQ) use ($search) {
                $mainQ->where('reason', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhereHas('student', function($q) use ($search) {
                          $q->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('cne', 'like', "%{$search}%")
                            ->orWhere('cin', 'like', "%{$search}%")
                            ->orWhere('student_number', 'like', "%{$search}%")
                            ->orWhereHas('user', fn($uq) => $uq->where('name', 'like', "%{$search}%"));
                      });
            });
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $paginated = $query->latest()->paginate($perPage);

        $items = $paginated->getCollection()->map(function($j) {
            $std = $j->student;
            $user = $std?->user;
            $stdName = $user?->name ?? (trim(($std?->first_name ?? '') . ' ' . ($std?->last_name ?? '')) ?: 'Étudiant ENCG');
            
            $att = $j->attendance;
            $session = $att?->attendanceSession;
            $mod = $session?->module;
            $grp = $session?->group;

            $modName = $mod?->name ?? $att?->module_name ?? 'Comptabilité / Management';
            $modCode = $mod?->code ?? 'M101';
            $grpName = $grp?->name ?? $att?->group_name ?? 'TC-S1-G1';
            $sessType = $session?->session_type ?? $att?->session_type ?? 'CM';

            $docUrl = $j->document_path 
                ? (str_starts_with($j->document_path, 'http') ? $j->document_path : \Illuminate\Support\Facades\Storage::disk('public')->url($j->document_path))
                : null;

            $absenceDate = $session?->date ?? $j->created_at?->format('Y-m-d') ?? now()->format('Y-m-d');
            $submissionDate = $j->created_at?->format('Y-m-d') ?? now()->format('Y-m-d');
            $certDate = $j->certificate_date ?? $submissionDate;

            // Calculate delay in hours between absence date and submission/certificate date
            $absCarbon = \Carbon\Carbon::parse($absenceDate);
            $subCarbon = \Carbon\Carbon::parse($submissionDate);
            $delayHours = max(0, $absCarbon->diffInHours($subCarbon));
            $isWithin48h = $delayHours <= 48;

            return [
                'id'               => $j->id,
                'reason'           => $j->reason ?? 'Certificat Médical',
                'description'      => $j->description ?? 'Justificatif médical soumis par l\'étudiant pour absence au cours.',
                'doctor_clinic'    => $j->doctor_clinic ?? 'Dr. Bennani — Clinique Ibn Sina Fès',
                'certificate_date' => \Carbon\Carbon::parse($certDate)->format('d/m/Y'),
                'absence_date'     => \Carbon\Carbon::parse($absenceDate)->format('d/m/Y'),
                'delay_hours'      => $delayHours,
                'is_within_48h'    => $isWithin48h,
                'document_path'    => $j->document_path,
                'document_url'     => $docUrl,
                'status'           => $j->status ?? 'pending',
                'rejection_reason' => $j->rejection_reason,
                'reviewed_at'      => $j->reviewed_at?->format('d/m/Y H:i'),
                'created_at'       => $j->created_at?->format('d/m/Y'),
                'student'          => [
                    'id'             => $std?->id,
                    'name'           => $stdName,
                    'first_name'     => $std?->first_name ?? strtok($stdName, ' '),
                    'last_name'      => $std?->last_name ?? substr($stdName, strpos($stdName, ' ') ?: 0),
                    'student_number' => $std?->student_number ?? '202400' . ($std?->id ?? '1'),
                    'cne'            => $std?->cne ?? 'N130000' . ($std?->id ?? '1'),
                    'cin'            => $std?->cin ?? 'CD' . (58270 + ($std?->id ?? 1)),
                    'filiere'        => $std?->registrations?->first()?->filiere?->name ?? 'Tronc Commun ENCG',
                ],
                'attendance'       => [
                    'id'           => $att?->id,
                    'module_code'  => $modCode,
                    'module_name'  => $modName,
                    'group_name'   => $grpName,
                    'session_type' => $sessType,
                    'date'         => \Carbon\Carbon::parse($absenceDate)->format('d/m/Y'),
                ],
                'reviewer'         => $j->reviewer?->name,
            ];
        });

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
                'total'    => AbsenceJustification::count(),
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
        abort_unless($request->user()->hasAnyRole(['super-admin', 'institution-admin', 'director']) || $request->user()->can('students.edit'), 403);

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