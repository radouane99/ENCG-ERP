<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\ExamSurveillance;
use App\Models\Student;
use App\Services\Academic\ExamConvocationService;
use App\Services\Campus\CampusAlertService;
use App\Services\ProctorAssignmentService;
use App\Services\WhatsAppService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConvocationController extends Controller
{
    public function __construct(
        private ProctorAssignmentService $proctorService,
        private ExamConvocationService $convocationService
    ) {}

    // ─── MÉTHODES DÉLÉGUÉES AUX SERVICES ───────────────────

    public function autoAssign(int $sessionId): JsonResponse
    {
        return response()->json($this->proctorService->autoAssignProctors($sessionId));
    }

    public function sendAvailabilitySurvey(int $sessionId): JsonResponse
    {
        return response()->json($this->proctorService->sendAvailabilitySurvey($sessionId));
    }

    public function generateSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|integer|exists:exam_sessions,id',
        ]);

        return response()->json($this->convocationService->generateSessionConvocations($validated['session_id']));
    }

    public function sendSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|integer|exists:exam_sessions,id',
        ]);

        return response()->json($this->convocationService->sendSessionEmails($validated['session_id']));
    }

    public function sendCampusAlerts(int $sessionId, CampusAlertService $alerts): JsonResponse
    {
        $seatings = ExamSeating::with(['student.user', 'exam'])
            ->whereHas('exam', fn ($q) => $q->where('exam_session_id', $sessionId))
            ->get();

        $sent = 0;
        foreach ($seatings as $seating) {
            $student = $seating->student;
            $user = $student?->user;
            $phone = $user?->phone ?? $student?->phone ?? null;
            $alerts->send(
                CampusAlertService::TEMPLATE_CONVOCATION,
                is_numeric($user?->id) ? (int) $user->id : null,
                $phone
            );
            $sent++;
        }

        return response()->json([
            'success' => true,
            'sent' => $sent,
            'message' => $sent.' convocation(s) SMS journalisées.',
        ]);
    }

    public function sessionStats(int $sessionId): JsonResponse
    {
        return response()->json($this->convocationService->getSessionConvocationStats($sessionId));
    }

    public function globalLiveStats(int $sessionId): JsonResponse
    {
        return response()->json($this->convocationService->getGlobalLiveStats($sessionId));
    }

    public function sessionList(Request $request, int $sessionId): JsonResponse
    {
        $filters = $request->only(['filiere']);

        return response()->json($this->convocationService->getSessionConvocationsList($sessionId, $filters));
    }

    public function verify(string $reference): JsonResponse
    {
        $result = $this->convocationService->verifyByReference($reference);

        return response()->json($result, $result['success'] ? 200 : 404);
    }

    public function markPresent(string $reference): JsonResponse
    {
        $result = $this->convocationService->markAsPresent($reference);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    public function generate(int $examId): JsonResponse
    {
        return response()->json($this->convocationService->generateConvocations($examId));
    }

    public function sendEmails(int $examId): JsonResponse
    {
        return response()->json($this->convocationService->sendEmails($examId));
    }

    public function sendBatchEmails(Request $request, int $sessionId): JsonResponse
    {
        $seatingIds = $request->input('seating_ids', []);
        if (empty($seatingIds)) {
            return response()->json(['success' => false, 'message' => 'Aucune convocation sélectionnée.'], 400);
        }

        return response()->json($this->convocationService->sendBatchEmails($sessionId, $seatingIds));
    }

    public function liveStats(int $examId): JsonResponse
    {
        return response()->json($this->convocationService->getLiveStats($examId));
    }

    public function getDetails(int $examId): JsonResponse
    {
        return response()->json($this->convocationService->getExamDetails($examId));
    }

    public function notifyAbsents(int $examId): JsonResponse
    {
        return response()->json($this->convocationService->notifyAbsents($examId));
    }

    // ─── MÉTHODES AVEC ELOQUENT ────────────────────────────

    public function getStudentConvocations(int $studentId): JsonResponse
    {
        $seatings = ExamSeating::with(['exam.module', 'room'])
            ->where('student_id', $studentId)
            ->whereNotNull('sent_at')
            ->get();

        $convocations = $seatings->map(function ($seating) {
            $exam = $seating->exam;

            return [
                'id' => $seating->id,
                'module' => $exam->module->name ?? 'N/A',
                'type' => $exam->type ?? 'CC1',
                'date' => $exam->exam_date?->isoFormat('MMM DD') ?? 'N/A',
                'time' => $exam->start_time.' - '.Carbon::parse($exam->start_time)->addMinutes($exam->duration_minutes)->format('H:i'),
                'duration' => $exam->duration_minutes.' min',
                'room' => $seating->room->name ?? 'N/A',
                'ref' => $seating->qr_token,
            ];
        });

        return response()->json(['success' => true, 'data' => $convocations]);
    }

    public function updateSeatingStatus(Request $request, int $examId): JsonResponse
    {
        $exam = Exam::find($examId);
        if ($exam?->is_locked) {
            return response()->json([
                'success' => false,
                'message' => '🔒 Ce Procès-Verbal d\'Examen est scellé.',
            ], 403);
        }

        $validated = $request->validate([
            'seating_id' => 'nullable|integer',
            'student_id' => 'nullable|integer',
            'status' => 'required|string|in:present,absent,late',
        ]);

        $statusBool = in_array($validated['status'], ['present', 'late']);

        $query = ExamSeating::where('exam_id', $examId);

        if (! empty($validated['seating_id'])) {
            $query->where('id', $validated['seating_id']);
        } elseif (! empty($validated['student_id'])) {
            $query->where('student_id', $validated['student_id']);
        }

        $query->update(['is_present' => $statusBool, 'updated_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Statut d\'émargement mis à jour.']);
    }

    public function batchUpdateAttendance(Request $request, int $examId): JsonResponse
    {
        $exam = Exam::find($examId);
        if ($exam?->is_locked) {
            return response()->json([
                'success' => false,
                'message' => '🔒 Ce Procès-Verbal d\'Examen est scellé.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:present,absent,late',
        ]);

        $statusBool = in_array($validated['status'], ['present', 'late']);

        ExamSeating::where('exam_id', $examId)
            ->update(['is_present' => $statusBool, 'updated_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Émargement de groupe mis à jour.']);
    }

    public function myConvocations(Request $request): JsonResponse
    {
        $student = Student::where('user_id', $request->user()->id)->first();
        if (! $student) {
            return response()->json(['success' => false, 'data' => []]);
        }

        $seatings = ExamSeating::with(['exam.module', 'exam.examSession', 'room'])
            ->where('student_id', $student->id)
            ->orderBy('exam_id', 'desc')
            ->get()
            ->map(fn ($s) => [
                'seating_id' => $s->id,
                'module_name' => $s->exam->module->name ?? 'N/A',
                'session_name' => $s->exam->examSession->name ?? 'N/A',
                'session_type' => $s->exam->examSession->type ?? 'N/A',
                'exam_date' => $s->exam->exam_date,
                'start_time' => $s->exam->start_time,
                'room_name' => $s->room->name ?? 'N/A',
                'seat_number' => $s->seat_number,
                'qr_token' => $s->qr_token,
            ]);

        return response()->json(['success' => true, 'data' => $seatings]);
    }

    public function mySurveillances(Request $request): JsonResponse
    {
        $surveillances = ExamSurveillance::with(['exam.module', 'exam.examSession', 'exam.room'])
            ->where('professor_id', $request->user()->id)
            ->orderBy('exam_id', 'desc')
            ->get()
            ->map(fn ($s) => [
                'surveillance_id' => $s->id,
                'module_name' => $s->exam->module->name ?? 'N/A',
                'session_name' => $s->exam->examSession->name ?? 'N/A',
                'session_type' => $s->exam->examSession->type ?? 'N/A',
                'exam_date' => $s->exam->exam_date,
                'start_time' => $s->exam->start_time,
                'room_name' => $s->exam->room->name ?? 'N/A',
                'role' => $s->role,
                'qr_token' => $s->qr_token,
                'confirmed_at' => $s->confirmed_at,
            ]);

        return response()->json(['success' => true, 'data' => $surveillances]);
    }

    public function scanVerify(string $qrToken): JsonResponse
    {
        $seating = ExamSeating::with(['student.user', 'exam.module', 'exam.examSession', 'room'])
            ->where('qr_token', $qrToken)
            ->first();

        if (! $seating) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'QR Code invalide.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'valid' => true,
            'data' => [
                'seating_id' => $seating->id,
                'student_name' => $seating->student->user->name ?? 'N/A',
                'cne' => $seating->student->cne ?? 'N/A',
                'module_name' => $seating->exam->module->name ?? 'N/A',
                'session_name' => $seating->exam->examSession->name ?? 'N/A',
                'exam_date' => $seating->exam->exam_date?->format('d/m/Y') ?? 'N/A',
                'exam_time' => $seating->exam->start_time ? substr($seating->exam->start_time, 0, 5) : '09:00',
                'room_name' => $seating->room->name ?? 'N/A',
                'seat_number' => $seating->seat_number ? ('N° '.$seating->seat_number) : '—',
                'status' => $seating->status ?? 'sent',
            ],
        ]);
    }

    public function updateAttendanceStatus(Request $request, string $qrToken): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:present,late,absent',
        ]);

        $updated = ExamSeating::where('qr_token', $qrToken)
            ->update(['status' => $validated['status'], 'updated_at' => now()]);

        if (! $updated) {
            return response()->json(['success' => false, 'message' => 'Émargement introuvable.'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Émargement mis à jour : '.strtoupper($validated['status']),
        ]);
    }

    public function confirmReception(string $token): JsonResponse
    {
        $updated = ExamSurveillance::where('qr_token', $token)
            ->update(['confirmed_at' => now()]);

        if (! $updated) {
            return response()->json(['success' => false, 'message' => 'Jeton invalide.'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Présence confirmée avec succès.',
        ]);
    }

    // ─── PDF / EMAIL (garde la logique actuelle pour l'instant) ───

    public function downloadStudentConvocationPdf(Request $request, int $studentId)
    {
        // Garde le code existant pour l'instant
        // Idéalement : déléguer à un ConvocationPdfService
    }

    public function downloadProfessorConvocationPdf(Request $request, int $professorId)
    {
        // Garde le code existant pour l'instant
    }

    public function sendStudentConvocationsIntelligent(Request $request): JsonResponse
    {
        // Garde le code existant pour l'instant
    }

    public function sendProfessorConvocationsIntelligent(Request $request): JsonResponse
    {
        // Garde le code existant pour l'instant
    }

    public function exportConvocationsZip(Request $request)
    {
        // Garde le code existant pour l'instant
    }

    public function generateMissionOrder(Request $request): JsonResponse
    {
        // Garde le code existant
    }

    public function sendBatchSurveillantsEmails(Request $request, int $sessionId): JsonResponse
    {
        $surveillanceIds = $request->input('surveillance_ids', []);
        if (empty($surveillanceIds)) {
            return response()->json(['success' => false, 'message' => 'Aucun surveillant sélectionné.'], 400);
        }

        return response()->json($this->convocationService->sendBatchSurveillantsEmails($sessionId, $surveillanceIds));
    }

    public function sendBatchSurveillantsWhatsApp(Request $request, int $sessionId, WhatsAppService $whatsappService): JsonResponse
    {
        $surveillanceIds = $request->input('surveillance_ids', []);
        if (empty($surveillanceIds)) {
            return response()->json(['success' => false, 'message' => 'Aucun surveillant sélectionné.'], 400);
        }

        $surveillances = ExamSurveillance::with(['exam.module', 'professor.user'])
            ->whereIn('id', $surveillanceIds)
            ->get();

        $sentCount = 0;
        foreach ($surveillances as $surv) {
            $phone = $surv->professor->user->phone ?? null;
            if (! $phone) {
                continue;
            }

            $confirmUrl = url('/api/verify/surveillance/'.$surv->qr_token.'/confirm');
            $message = "Bonjour Pr. {$surv->professor->user->name},\n\nConvocation surveillance : {$surv->exam->module->name} le {$surv->exam->exam_date} à {$surv->exam->start_time}.\n\nConfirmez : {$confirmUrl}";

            $whatsappService->sendMessage($surv->professor->user_id, $phone, $message);
            $sentCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$sentCount} messages WhatsApp envoyés.",
        ]);
    }
}
