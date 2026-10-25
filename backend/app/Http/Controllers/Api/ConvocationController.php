<?php

namespace App\Http\Controllers\Api;

use App\Actions\Exam\ExportExamConvocationsAction;
use App\Actions\Exam\PublishSessionConvocationsAction;
use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\ExamSurveillance;
use App\Models\Professor;
use App\Models\Student;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\ExamConvocationService;
use App\Services\Academic\ExamWorkflowGuard;
use App\Services\Campus\CampusAlertService;
use App\Services\ProctorAssignmentService;
use App\Services\WhatsAppService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ConvocationController extends Controller
{
    public function __construct(
        private ProctorAssignmentService $proctorService,
        private ExamConvocationService $convocationService
    ) {}

    private function serviceResult(array $result): JsonResponse
    {
        return response()->json($result, ($result['success'] ?? true) ? 200 : 422);
    }

    // ─── MÉTHODES DÉLÉGUÉES AUX SERVICES ───────────────────

    public function autoAssign(int $sessionId): JsonResponse
    {
        return $this->serviceResult($this->proctorService->autoAssignProctors($sessionId));
    }

    public function assignmentData(int $sessionId): JsonResponse
    {
        $result = $this->proctorService->getAssignmentData($sessionId);

        return response()->json($result, $result['success'] ? 200 : 404);
    }

    public function manualAssign(Request $request, int $sessionId): JsonResponse
    {
        $validated = $request->validate([
            'assignments' => 'required|array',
            'assignments.*.exam_id' => 'required|integer',
            'assignments.*.room_id' => 'nullable|integer',
            'assignments.*.principal_id' => 'nullable|integer',
            'assignments.*.secondary_ids' => 'nullable|array',
            'assignments.*.secondary_id' => 'nullable|integer',
        ]);

        $result = $this->proctorService->saveManualAssignments($sessionId, $validated['assignments']);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    public function sendAvailabilitySurvey(int $sessionId): JsonResponse
    {
        return $this->serviceResult($this->proctorService->sendAvailabilitySurvey($sessionId));
    }

    public function generateSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|integer|exists:exam_sessions,id',
        ]);

        return $this->serviceResult($this->convocationService->generateSessionConvocations($validated['session_id']));
    }

    public function publishSession(Request $request): JsonResponse
    {
        $data = $request->validate(['session_id' => 'required|integer']);
        $count = app(PublishSessionConvocationsAction::class)->execute($data['session_id']);

        return response()->json(['success' => true, 'published_count' => $count, 'message' => $count.' convocation(s) publiée(s) sur le portail. Aucun email envoyé.']);
    }

    public function sendSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|integer|exists:exam_sessions,id',
        ]);

        return $this->serviceResult($this->convocationService->sendSessionEmails($validated['session_id']));
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
        return $this->serviceResult($this->convocationService->getSessionConvocationStats($sessionId));
    }

    public function globalLiveStats(int $sessionId): JsonResponse
    {
        return $this->serviceResult($this->convocationService->getGlobalLiveStats($sessionId));
    }

    public function sessionList(Request $request, int $sessionId): JsonResponse
    {
        $filters = $request->only(['filiere']);

        return $this->serviceResult($this->convocationService->getSessionConvocationsList($sessionId, $filters));
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
        return $this->serviceResult($this->convocationService->generateConvocations($examId));
    }

    public function sendEmails(int $examId): JsonResponse
    {
        return $this->serviceResult($this->convocationService->sendEmails($examId));
    }

    public function sendBatchEmails(Request $request, int $sessionId): JsonResponse
    {
        $seatingIds = $request->input('seating_ids', []);
        if (empty($seatingIds)) {
            return response()->json(['success' => false, 'message' => 'Aucune convocation sélectionnée.'], 400);
        }

        return $this->serviceResult($this->convocationService->sendBatchEmails($sessionId, $seatingIds));
    }

    public function liveStats(int $examId): JsonResponse
    {
        return $this->serviceResult($this->convocationService->getLiveStats($examId));
    }

    public function getDetails(int $examId): JsonResponse
    {
        return $this->serviceResult($this->convocationService->getExamDetails($examId));
    }

    public function notifyAbsents(int $examId): JsonResponse
    {
        return $this->serviceResult($this->convocationService->notifyAbsents($examId));
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
                'time' => $exam->formattedTimeRange(),
                'duration' => $exam->duration_minutes.' min',
                'room' => $seating->room->name ?? 'N/A',
                'ref' => $seating->qr_token,
            ];
        });

        return response()->json(['success' => true, 'data' => $convocations]);
    }

    public function updateSeatingStatus(Request $request, int $examId): JsonResponse
    {
        $exam = Exam::findOrFail($examId);

        $validated = $request->validate([
            'seating_id' => 'required_without:student_id|nullable|integer',
            'student_id' => 'required_without:seating_id|nullable|integer',
            'status' => 'required|string|in:present,absent,late',
        ]);

        $statusBool = in_array($validated['status'], ['present', 'late']);

        $query = ExamSeating::where('exam_id', $examId);

        if (! empty($validated['seating_id'])) {
            $query->where('id', $validated['seating_id']);
        } elseif (! empty($validated['student_id'])) {
            $query->where('student_id', $validated['student_id']);
        }

        DB::transaction(function () use ($query, $exam, $validated, $statusBool) {
            Exam::whereKey($exam->id)->lockForUpdate()->firstOrFail();
            $seat = $query->lockForUpdate()->firstOrFail();
            app(ExamWorkflowGuard::class)->attendance($exam->fresh(), $seat->room_id);
            $seat->update(['status' => $validated['status'], 'is_present' => $statusBool]);
        });

        return response()->json(['success' => true, 'message' => 'Statut d\'émargement mis à jour.']);
    }

    public function batchUpdateAttendance(Request $request, int $examId): JsonResponse
    {
        $exam = Exam::findOrFail($examId);

        $validated = $request->validate([
            'status' => 'required|string|in:present,absent,late',
        ]);

        $statusBool = in_array($validated['status'], ['present', 'late']);

        DB::transaction(function () use ($exam, $validated, $statusBool, $request) {
            $exam = Exam::whereKey($exam->id)->lockForUpdate()->firstOrFail();
            $admin = $request->user()->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'scolarite']);
            $query = ExamSeating::where('exam_id', $exam->id);
            if (! $admin) {
                $rooms = ExamSurveillance::where('exam_id', $exam->id)->where('professor_id', $request->user()->id)->pluck('room_id');
                abort_if($rooms->isEmpty(), 403);
                $query->whereIn('room_id', $rooms);
            }
            foreach ((clone $query)->distinct()->pluck('room_id') as $roomId) {
                app(ExamWorkflowGuard::class)->attendance($exam, $roomId);
            }
            $query->update(['status' => $validated['status'], 'is_present' => $statusBool, 'updated_at' => now()]);
        });

        return response()->json(['success' => true, 'message' => 'Émargement de groupe mis à jour.']);
    }

    public function saveExamSignature(Request $request, int $examId): JsonResponse
    {
        $exam = Exam::findOrFail($examId);
        app(ExamWorkflowGuard::class)->viewExam($exam);
        app(ExamWorkflowGuard::class)->mutableSession($exam->examSession);
        abort_if($exam->is_locked, 409, 'PV verrouillé.');
        $data = $request->validate(['signature_data' => 'required|string|max:2000000', 'role' => 'required|in:principal,secondary']);
        $rows = ExamSurveillance::where('exam_id', $examId)->where('professor_id', $request->user()->id)->get();
        $row = $rows->first(fn ($row) => ($data['role'] === 'principal') === in_array($row->role, ['president_salle', 'Surveillant Principal']));
        abort_unless($row, 403, 'Chaque surveillant doit apposer son propre visa depuis son compte.');
        $pad = str_starts_with($data['signature_data'], 'data:image/png;base64,');
        abort_unless($pad || $data['signature_data'] === 'DIGITAL_CERTIFIED_STAMP_ENCG', 422, 'Format de signature invalide.');
        $request->merge(['signature_type' => $pad ? 'pad' : 'digital', 'signature_data' => $pad ? $data['signature_data'] : null]);

        return $this->signExamPv($request, $row->id);
    }

    public function myConvocations(Request $request): JsonResponse
    {
        $student = Student::where('user_id', $request->user()->id)->first();
        if (! $student) {
            return response()->json(['success' => false, 'data' => []]);
        }

        $seatings = ExamSeating::with(['exam.module', 'exam.examSession', 'room'])
            ->where('student_id', $student->id)
            ->where(fn ($q) => $q->whereNotNull('sent_at')->orWhereIn('status', ['sent', 'present', 'absent', 'late']))
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
        $user = $request->user();
        $profId = $user->id;
        $fullName = trim(($user->first_name ?? '').' '.($user->last_name ?? ''));
        if ($fullName === '') {
            $fullName = $user->name ?? 'Enseignant';
        }

        $surveillances = ExamSurveillance::with(['exam.module.filiere', 'exam.examSession', 'exam.room', 'room', 'user'])
            ->where('professor_id', $profId)->whereHas('exam.module', fn ($q) => $q->where('institution_id', $user->institution_id))->orderByDesc('exam_id')->get();
        $monthsMap = [
            1 => 'JAN', 2 => 'FEV', 3 => 'MAR', 4 => 'AVR', 5 => 'MAI', 6 => 'JUIN',
            7 => 'JUIL', 8 => 'AOU', 9 => 'SEP', 10 => 'OCT', 11 => 'NOV', 12 => 'DEC',
        ];

        $data = $surveillances->map(function ($s) use ($monthsMap) {
            $examDate = $s->exam?->exam_date ? Carbon::parse($s->exam->exam_date) : null;
            $month = $examDate ? ($monthsMap[(int) $examDate->format('n')] ?? '—') : '—';
            $day = $examDate ? $examDate->format('d') : '—';
            $dateFull = $examDate ? $examDate->format('d/m/Y') : 'Non planifié';

            $startTime = $s->exam?->start_time ? substr($s->exam->start_time, 0, 5) : '08:30';
            $durationMins = $s->exam?->duration_minutes ?: 120;
            $startParts = explode(':', $startTime);
            $totalStartMins = ((int) ($startParts[0] ?? 8) * 60) + (int) ($startParts[1] ?? 30);
            $totalEndMins = $totalStartMins + $durationMins;
            $endH = str_pad(floor($totalEndMins / 60) % 24, 2, '0', STR_PAD_LEFT);
            $endM = str_pad($totalEndMins % 60, 2, '0', STR_PAD_LEFT);
            $endTime = "{$endH}:{$endM}";

            $roomName = $s->room->name ?? ($s->exam->room->name ?? 'Non renseignée');
            $filiereName = $s->exam?->module?->filiere?->name ?? 'Non renseigné';

            // Rôle : Principal (Responsable) vs Secondaire (Adjoint)
            $isPrincipal = in_array(strtolower($s->role ?? ''), ['primary', 'principal', 'responsable', 'surveillant principal']);
            $roleLabel = $isPrincipal ? 'Surveillant Principal (Responsable de Salle)' : 'Surveillant Secondaire (Salle)';

            return [
                'id' => $s->id,
                'exam_id' => $s->exam_id,
                'surveillance_id' => $s->id,
                'room_id' => $s->room_id ?? $s->exam?->room_id,
                'reference' => 'SURV-'.($examDate?->format('Y') ?? 'ND').'-'.str_pad($s->id, 3, '0', STR_PAD_LEFT),
                'module_name' => $s->exam->module->name ?? 'Module non renseigné',
                'session_name' => $s->exam->examSession->name ?? 'Session non renseignée',
                'session_type' => strtoupper($s->exam->examSession->type ?? 'NON RENSEIGNÉE'),
                'exam_date' => $s->exam->exam_date ?? null,
                'date_month' => $month,
                'date_day' => $day,
                'date_full' => $dateFull,
                'time' => "{$startTime} - {$endTime}",
                'room' => $roomName,
                'group_name' => $filiereName,
                'role' => $roleLabel,
                'is_principal' => $isPrincipal,
                'qr_token' => $s->qr_token,
                'is_confirmed' => (bool) $s->confirmed_at,
                'confirmed_at' => $s->confirmed_at,
            ];
        });

        return response()->json(['success' => true, 'data' => $data], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Confirmation officielle de présence et accusé de réception par le surveillant.
     */
    public function confirmSurveillance(Request $request, mixed $id = null): JsonResponse
    {
        $data = $request->validate(['surveillance_ids' => 'sometimes|array|min:1|max:200', 'surveillance_ids.*' => 'integer|distinct', 'all' => 'sometimes|boolean']);
        $count = DB::transaction(function () use ($request, $id, $data) {
            $query = ExamSurveillance::whereHas('exam.module', fn ($q) => $q->where('institution_id', $request->user()->institution_id));
            if (! $request->user()->hasAnyRole(['admin', 'institution-admin', 'super-admin', 'director', 'scolarite'])) {
                $query->where('professor_id', $request->user()->id);
            }
            if (isset($data['surveillance_ids'])) {
                $query->whereIn('id', $data['surveillance_ids']);
            } elseif ($id !== 'all' && ! ($data['all'] ?? false)) {
                $query->whereKey($id);
            }
            $rows = $query->lockForUpdate()->get();
            abort_if($rows->isEmpty(), 404, 'Aucune surveillance affectée ne correspond.');
            abort_if(isset($data['surveillance_ids']) && $rows->count() !== count($data['surveillance_ids']), 403, 'Une surveillance ne vous est pas affectée.');
            foreach ($rows as $row) {
                if (! $row->confirmed_at) {
                    $row->update(['confirmed_at' => now()]);
                }
            }

            return $rows->count();
        });

        return response()->json(['success' => true, 'message' => "Réception confirmée pour {$count} surveillance(s).", 'confirmed_at' => now()->toDateTimeString()]);
    }

    /**
     * Signature électronique officielle du PV d'examen par le surveillant.
     */
    public function signExamPv(Request $request, mixed $id = null): JsonResponse
    {
        $data = $request->validate(['signature_type' => 'required|in:digital,pad', 'signature_data' => 'required_if:signature_type,pad|nullable|string|max:2000000', 'records' => 'sometimes|array|max:500', 'records.*.student_id' => 'required|integer|distinct', 'records.*.status' => 'required|in:present,absent']);
        $row = DB::transaction(function () use ($request, $id, $data) {
            $target = ExamSurveillance::whereKey($id)->where('professor_id', $request->user()->id)->firstOrFail();
            Exam::whereKey($target->exam_id)->lockForUpdate()->firstOrFail();
            $row = ExamSurveillance::with('exam.module')->whereKey($id)->where('professor_id', $request->user()->id)->lockForUpdate()->firstOrFail();
            abort_unless((int) $row->exam->module->institution_id === (int) $request->user()->institution_id, 403);
            abort_if(! $row->exam->exam_date || Carbon::parse($row->exam->exam_date)->startOfDay()->isFuture(), 422, 'L’examen n’a pas encore eu lieu.');
            $room = $row->room_id ?? $row->exam->room_id;
            $seats = ExamSeating::where('exam_id', $row->exam_id)->where('room_id', $room)->orderBy('id')->lockForUpdate()->get(['id', 'student_id', 'is_present']);
            abort_if($seats->isEmpty(), 422, 'Aucune liste de placement enregistrée pour cette salle.');
            foreach ($data['records'] ?? [] as $record) {
                $seat = $seats->firstWhere('student_id', $record['student_id']);
                abort_unless($seat, 403, 'Étudiant hors de la salle affectée.');
                $present = $record['status'] === 'present';
                $alreadySigned = ExamSurveillance::where('exam_id', $row->exam_id)->where('room_id', $room)->whereNotNull('signed_at')->exists();
                abort_if($alreadySigned && (bool) $seat->is_present !== $present, 409, 'PV visé : une réouverture est requise.');
                if (! $alreadySigned) {
                    $seat->update(['status' => $record['status'], 'is_present' => $present]);
                }
            }
            if ($row->signed_at) {
                return $row;
            }
            app(ExamWorkflowGuard::class)->mutableSession($row->exam->examSession);
            abort_if($row->exam->is_locked, 409, 'PV verrouillé.');
            abort_if($seats->contains(fn ($seat) => $seat->is_present === null), 422, 'Terminer tous les pointages avant de viser le PV.');
            $row->fill(['signature_data' => $data['signature_data'] ?? null, 'signature_type' => $data['signature_type'], 'signed_at' => now(),
                'signature_hash' => hash('sha256', json_encode(['exam_id' => $row->exam_id, 'room_id' => $room, 'signer' => $request->user()->id, 'seats' => $seats->toArray()], JSON_THROW_ON_ERROR))])->save();
            activity()->causedBy($request->user())->performedOn($row)->log('surveillance_pv_visa_recorded');

            return $row;
        });

        return response()->json(['success' => true, 'message' => 'Visa de surveillance enregistré.', 'signer_name' => $request->user()->name, 'signed_at' => $row->signed_at, 'signature_hash' => $row->signature_hash, 'status' => 'signed']);
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

        app(ExamWorkflowGuard::class)->viewExam($seating->exam);

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
                'seat_number' => $seating->seat_number ? ('N° '.ExamConvocationService::seatNumberFor($seating)) : '—',
                'status' => $seating->status ?? 'sent',
            ],
        ]);
    }

    public function updateAttendanceStatus(Request $request, string $qrToken): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:present,late,absent',
        ]);

        $updated = DB::transaction(function () use ($request, $qrToken, $validated) {
            $seat = ExamSeating::with('exam.module')->where('qr_token', $qrToken)->lockForUpdate()->first();
            if (! $seat) {
                return 0;
            }
            app(ExamWorkflowGuard::class)->attendance($seat->exam, $seat->room_id);
            abort_unless((int) $seat->exam->module->institution_id === (int) $request->user()->institution_id, 403);
            $surveillances = ExamSurveillance::where('exam_id', $seat->exam_id)->where('room_id', $seat->room_id)->lockForUpdate()->get();
            abort_unless($request->user()->hasAnyRole(['admin', 'institution-admin', 'super-admin', 'director', 'scolarite']) || $surveillances->contains('professor_id', $request->user()->id), 403);
            abort_if($surveillances->contains(fn ($row) => $row->signed_at !== null), 409, 'PV visé : une réouverture est requise.');
            $seat->update(['status' => $validated['status'], 'is_present' => $validated['status'] !== 'absent']);

            return 1;
        });

        if (! $updated) {
            return response()->json(['success' => false, 'message' => 'Émargement introuvable.'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Émargement mis à jour : '.strtoupper($validated['status']),
        ]);
    }

    public function confirmReception(Request $request, string $token)
    {
        $surveillances = ExamSurveillance::with(['exam.module', 'professor.user', 'room'])
            ->where('qr_token', $token)
            ->get();

        if ($surveillances->isEmpty()) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Jeton invalide ou introuvable.'], 404);
            }

            return response('<h3>Lien de confirmation invalide ou expiré.</h3>', 404);
        }

        $first = $surveillances->first();
        $profId = $first->professor_id;
        $sessionId = $first->exam?->exam_session_id;

        $allSurveillances = collect();
        if ($profId && $sessionId) {
            ExamSurveillance::where('professor_id', $profId)
                ->whereHas('exam', fn ($q) => $q->where('exam_session_id', $sessionId))
                ->update(['confirmed_at' => now()]);

            $allSurveillances = ExamSurveillance::with(['exam.module', 'exam.examSession', 'professor.user', 'room'])
                ->where('professor_id', $profId)
                ->whereHas('exam', fn ($q) => $q->where('exam_session_id', $sessionId))
                ->orderBy('exam_id')
                ->get();
        } else {
            ExamSurveillance::where('qr_token', $token)->update(['confirmed_at' => now()]);
            $allSurveillances = $surveillances;
        }

        if ($allSurveillances->isEmpty()) {
            $allSurveillances = $surveillances;
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Présence confirmée avec succès.',
                'confirmed_at' => now()->toDateTimeString(),
            ]);
        }

        return view('emails.surveillance_confirmed', [
            'surveillance' => $first,
            'allSurveillances' => $allSurveillances,
        ]);
    }

    // ─── PDF / EMAIL (garde la logique actuelle pour l'instant) ───

    public function downloadStudentConvocationPdf(Request $request, string|int $studentId)
    {
        $student = (is_numeric($studentId) ? Student::with(['user', 'registrations.group.filiere', 'registrations.filiere'])->find($studentId) : Student::where('uuid', $studentId)->with(['user', 'registrations.group.filiere', 'registrations.filiere'])->first())
            ?: (is_numeric($studentId) ? Student::where('user_id', $studentId)->with(['user', 'registrations.group.filiere', 'registrations.filiere'])->first() : null)
            ?: ($request->user()?->student)
            ?: Student::where('user_id', $request->user()?->id)->with(['user', 'registrations.group.filiere', 'registrations.filiere'])->first();

        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Étudiant introuvable.'], 404);
        }

        abort_unless($request->user() && (int) $student->institution_id === (int) $request->user()->institution_id, 404);
        $isOwner = (int) $student->user_id === (int) $request->user()->id;
        if (! $isOwner) {
            app(ExamWorkflowGuard::class)->manage();
        }

        $sessionType = strtoupper($request->query('session_type', 'ORDINAIRE'));

        $query = ExamSeating::with(['exam.module', 'exam.session', 'exam.group', 'room'])
            ->where('student_id', $student->id)
            ->whereHas('exam.session', fn ($q) => $q->where('academic_year_id', AcademicContext::yearId()));
        if ($request->filled('session_id')) {
            $query->whereHas('exam', fn ($q) => $q->where('exam_session_id', $request->integer('session_id')));
        }
        if ($isOwner) {
            $query->where(fn ($q) => $q->whereNotNull('sent_at')->orWhereIn('status', ['sent', 'present', 'absent', 'late']));
        }

        if ($sessionType === 'RATTRAPAGE') {
            $query->whereHas('exam.session', fn ($q) => $q->whereIn('type', ['rattrapage', 'resit']));
        } elseif (in_array($sessionType, ['ORDINAIRE', 'NORMALE'], true)) {
            $query->whereHas('exam.session', fn ($q) => $q->whereIn('type', ['normal', 'normale', 'ordinaire']));
        }

        $seatings = $query->get();

        // Fallback intelligent if session types aren't explicitly labeled
        abort_if($seatings->isEmpty(), 404, 'Aucune convocation diffusée pour cette session et cette année.');

        $seatings = $seatings->sortBy(function ($s) {
            return ($s->exam?->exam_date ? Carbon::parse($s->exam->exam_date)->format('Ymd') : '99999999').'_'.($s->exam?->start_time ?? '00:00');
        });

        $stUser = $student->user;
        $studentName = $stUser ? trim(($stUser->first_name ?? '').' '.($stUser->last_name ?? '')) : 'Étudiant ENCG';
        $cne = $student->cne ?? '—';
        $cin = $student->cin ?? '—';

        $reg = $student->registrations()->latest()->first();
        $filiereName = $reg?->filiere?->name ?? 'Tronc Commun ENCG';
        $groupName = $reg?->group?->name ?? '—';
        $subGroup = $reg?->sub_group ?? '—';
        $semesterNumber = $reg?->semester_number ?? 2;

        $examsFormatted = $seatings->map(function ($s) {
            $exam = $s->exam;
            $moduleName = $exam?->module?->name ?? 'Module';
            $moduleCode = $exam?->module?->code ?? ('MOD-'.($exam?->id ?? '0'));
            $dateStr = $exam?->exam_date ? Carbon::parse($exam->exam_date)->format('d/m/Y') : 'À déterminer';
            $timeStr = $exam?->start_time ? substr($exam->start_time, 0, 5) : '09:00';
            $duration = ($exam?->duration_minutes ?? 120).' min';
            $roomName = $s->room?->name ?? 'Salle non assignée';
            $seatNumber = ExamConvocationService::seatNumberFor($s);

            return [
                'date' => $dateStr,
                'time' => "{$timeStr} ({$duration})",
                'module_code' => $moduleCode,
                'module_name' => $moduleName,
                'room' => $roomName,
                'seat' => "Table N° {$seatNumber}",
                'qr_token' => $s->qr_token ?? ("CONV-{$s->id}"),
            ];
        })->values()->all();

        // Verification token & QR Code
        $verifyToken = hash('sha256', "CONV-STUDENT-{$cne}-{$sessionType}-".now()->toDateString());
        $verifyUrl = url("/verify/document/CONV-{$cne}");
        $qrBase64 = null;
        if (class_exists(QrCode::class)) {
            try {
                $qrSvg = QrCode::format('svg')->size(160)->margin(0)->generate($verifyUrl);
                $qrBase64 = 'data:image/svg+xml;base64,'.base64_encode($qrSvg);
            } catch (\Throwable $e) {
                \Log::warning('QR generation error for Convocation: '.$e->getMessage());
            }
        }

        $logoBase64 = null;
        $logoPath = public_path('logo-encg.png');
        if (file_exists($logoPath)) {
            $logoBase64 = 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath));
        }

        $pdf = Pdf::loadView('pdf.convocation_officielle_etudiant', [
            'student' => $student,
            'studentName' => $studentName,
            'cne' => $cne,
            'cin' => $cin,
            'filiereName' => $filiereName,
            'groupName' => $groupName,
            'subGroup' => $subGroup,
            'semesterNumber' => $semesterNumber,
            'sessionType' => $sessionType === 'RATTRAPAGE' ? 'SESSION DE RATTRAPAGE' : 'SESSION ORDINAIRE',
            'academicYear' => '2026/2027',
            'exams' => $examsFormatted,
            'logoBase64' => $logoBase64,
            'qrBase64' => $qrBase64,
            'verifyUrl' => $verifyUrl,
            'verifyToken' => $verifyToken,
        ])->setPaper('a4', 'portrait');

        $filename = 'Convocation_Examens_'.str_replace(' ', '_', $studentName).'_'.$sessionType.'.pdf';

        return $pdf->download($filename);
    }

    public function downloadProfessorConvocationPdf(Request $request, int $professorId)
    {
        $professor = Professor::findOrFail($professorId);
        if ((int) $professor->user_id !== (int) $request->user()->id) {
            app(ExamWorkflowGuard::class)->manage();
        }
        $request->merge(['professor_id' => $professor->user_id]);

        return app(PdfExportController::class)->downloadMySurveillancesPdf($request);
    }

    public function sendStudentConvocationsIntelligent(Request $request): JsonResponse
    {
        $data = $request->validate(['session_id' => 'required|integer', 'seating_ids' => 'sometimes|array', 'seating_ids.*' => 'integer']);
        $result = isset($data['seating_ids']) ? $this->convocationService->sendBatchEmails($data['session_id'], $data['seating_ids']) : $this->convocationService->sendSessionEmails($data['session_id']);

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    public function sendProfessorConvocationsIntelligent(Request $request): JsonResponse
    {
        $data = $request->validate(['session_id' => 'required|integer', 'surveillance_ids' => 'sometimes|array', 'surveillance_ids.*' => 'integer']);
        $ids = $data['surveillance_ids'] ?? ExamSurveillance::whereHas('exam', fn ($q) => $q->where('exam_session_id', $data['session_id']))->pluck('id')->all();
        $result = $this->convocationService->sendBatchSurveillantsEmails($data['session_id'], $ids);

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    public function exportConvocationsZip(Request $request)
    {
        $data = $request->validate(['session_id' => 'required|integer', 'student_ids' => 'sometimes|array', 'student_ids.*' => 'integer', 'filiere_id' => 'nullable|integer']);

        return app(ExportExamConvocationsAction::class)->execute($data['session_id'], $data['student_ids'] ?? [], $data['filiere_id'] ?? null);
    }

    public function generateMissionOrder(Request $request): JsonResponse
    {
        $data = $request->validate(['surveillance_id' => 'required|integer']);
        $row = ExamSurveillance::with('exam')->findOrFail($data['surveillance_id']);
        app(ExamWorkflowGuard::class)->viewExam($row->exam);
        if ((int) $row->professor_id !== (int) $request->user()->id) {
            app(ExamWorkflowGuard::class)->manage();
        }

        return response()->json(['success' => true, 'message' => 'Document de surveillance disponible.', 'pdf_url' => url('/api/exam-planning/surveillant/'.$row->id.'/download')]);
    }

    public function sendBatchSurveillantsEmails(Request $request, int $sessionId): JsonResponse
    {
        $surveillanceIds = $request->input('surveillance_ids', []);
        if (empty($surveillanceIds)) {
            return response()->json(['success' => false, 'message' => 'Aucun surveillant sélectionné.'], 400);
        }

        return $this->serviceResult($this->convocationService->sendBatchSurveillantsEmails($sessionId, $surveillanceIds));
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
