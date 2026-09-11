<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAbsenceController extends Controller
{
    /**
     * Absences et assiduité de l'étudiant connecté avec KPIs et justificatifs.
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $attendances = Attendance::with([
            'attendanceSession.module',
            'attendanceSession.professor.user',
            'absenceJustification.media',
        ])
            ->where('student_id', $student->id)
            ->latest()
            ->get();

        $totalSessions = $attendances->count();
        $presentCount = $attendances->where('status', 'present')->count();
        $lateCount = $attendances->where('status', 'late')->count();
        $absences = $attendances->where('status', 'absent');
        $absentCount = $absences->count();

        $justifiedCount = $absences->filter(fn ($a) => (bool) $a->is_justified || ($a->absenceJustification && $a->absenceJustification->status === 'approved'))->count();
        $pendingJustificationCount = $absences->filter(fn ($a) => ! $a->is_justified && $a->absenceJustification && $a->absenceJustification->status === 'pending')->count();
        $unjustifiedCount = max(0, $absentCount - $justifiedCount - $pendingJustificationCount);

        $attendanceRate = $totalSessions > 0
            ? round((($presentCount + ($lateCount * 0.5)) / $totalSessions) * 100, 1)
            : 100.0;

        // Group by module to calculate warnings (>= 2 absences) and threshold reached (>= 3 absences)
        $moduleAbsenceCounts = [];
        foreach ($absences as $att) {
            $modId = $att->attendanceSession?->module_id ?? 0;
            $modName = $att->attendanceSession?->module?->name ?? 'Module';
            if ($modId > 0) {
                if (! isset($moduleAbsenceCounts[$modId])) {
                    $moduleAbsenceCounts[$modId] = [
                        'module_id' => $modId,
                        'module_name' => $modName,
                        'total' => 0,
                        'unjustified' => 0,
                    ];
                }
                $moduleAbsenceCounts[$modId]['total']++;
                if (! $att->is_justified && (! $att->absenceJustification || $att->absenceJustification->status !== 'approved')) {
                    $moduleAbsenceCounts[$modId]['unjustified']++;
                }
            }
        }

        $warningModules = array_values(array_filter($moduleAbsenceCounts, fn ($m) => $m['unjustified'] >= 2));

        $records = $attendances->map(function ($att) {
            $session = $att->attendanceSession;
            $justification = $att->absenceJustification;

            $mediaList = [];
            if ($justification && $justification->media) {
                $mediaList = $justification->media->map(fn ($m) => [
                    'id' => $m->id,
                    'file_name' => $m->file_name,
                    'mime_type' => $m->mime_type,
                    'original_url' => asset('storage/'.$m->id.'/'.$m->file_name),
                ])->values()->all();
            }

            $typeLabel = match (strtolower((string) $session?->session_type)) {
                'cm' => 'Cours Magistral (CM)',
                'td' => 'Travaux Dirigés (TD)',
                'tp' => 'Travaux Pratiques (TP)',
                default => $session?->session_type ?: 'Séance',
            };

            $sessionPayload = $session ? [
                'id' => $session->id,
                'session_date' => $session->session_date ? $session->session_date->format('Y-m-d') : null,
                'start_time' => $session->start_time,
                'end_time' => $session->end_time,
                'room_name' => $session->room_name ?: $session->room ?: null,
                'session_type' => $session->session_type,
                'session_type_label' => $typeLabel,
                'module_id' => $session->module_id,
                'module' => $session->module ? [
                    'id' => $session->module->id,
                    'name' => $session->module->name,
                    'code' => $session->module->code,
                ] : null,
                'professor' => $session->professor?->user ? [
                    'name' => $session->professor->user->name,
                ] : null,
            ] : null;

            $justificationPayload = $justification ? [
                'id' => $justification->id,
                'attendance_id' => $justification->attendance_id,
                'reason' => $justification->reason,
                'description' => $justification->description,
                'status' => $justification->status,
                'rejection_reason' => $justification->rejection_reason,
                'reviewed_at' => $justification->reviewed_at?->toIso8601String(),
                'media' => $mediaList,
            ] : null;

            return [
                'id' => $att->id,
                'attendance_session_id' => $att->attendance_session_id,
                'student_id' => $att->student_id,
                'status' => is_string($att->status) ? $att->status : ($att->status?->value ?? 'present'),
                'is_justified' => (bool) $att->is_justified,
                'notes' => $att->notes,
                'scanned_at' => $att->scanned_at?->toIso8601String(),
                'attendanceSession' => $sessionPayload,
                'attendance_session' => $sessionPayload,
                'absenceJustification' => $justificationPayload,
                'absence_justification' => $justificationPayload,
            ];
        });

        $student->loadMissing(['filiere', 'group']);
        $currentYear = AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::latest('id')->first();
        $academicYearName = $currentYear?->displayLabel() ?? '2025/2026';

        return response()->json([
            'success' => true,
            'data' => $records,
            'absences' => $records,
            'student_meta' => [
                'name' => $request->user()?->name,
                'cne' => $student->cne,
                'apogee_code' => $student->apogee_code,
                'filiere' => $student->filiere?->name,
                'group' => $student->group?->name,
                'academic_year' => $academicYearName,
            ],
            'stats' => [
                'total_sessions' => $totalSessions,
                'present_count' => $presentCount,
                'absent_count' => $absentCount,
                'late_count' => $lateCount,
                'justified_count' => $justifiedCount,
                'pending_count' => $pendingJustificationCount,
                'unjustified_count' => $unjustifiedCount,
                'attendance_rate' => $attendanceRate,
                'warning_modules' => $warningModules,
                'max_unjustified_allowed' => 3,
            ],
        ]);
    }
}
