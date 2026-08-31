<?php

namespace App\Services\Academic;

use App\Mail\ConvocationEmail;
use App\Mail\ProfessorConvocationEmail;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\Room;
use App\Models\Student;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ExamConvocationService
{
    /**
     * Générer les convocations pour tous les examens d'une session.
     */
    public function generateSessionConvocations(int $sessionId): array
    {
        $session = ExamSession::with(['exams.group.students', 'exams.module'])->findOrFail($sessionId);

        $totalGenerated = 0;

        foreach ($session->exams as $exam) {
            $existingSeatings = ExamSeating::where('exam_id', $exam->id)->get();
            $defaultRoomId = $exam->room_id ?? Room::first()?->id;

            foreach ($existingSeatings as $index => $seating) {
                $updates = [];

                if (empty($seating->qr_token)) {
                    $updates['qr_token'] = Str::uuid()->toString();
                }
                if (empty($seating->room_id) && $defaultRoomId) {
                    $updates['room_id'] = $defaultRoomId;
                }
                if (empty($seating->seat_number)) {
                    $updates['seat_number'] = $index + 1;
                }

                if (! empty($updates)) {
                    $seating->update($updates);
                    $totalGenerated++;
                }
            }

            // Générer les QR tokens pour les surveillances
            ExamSurveillance::where('exam_id', $exam->id)
                ->whereNull('qr_token')
                ->get()
                ->each(fn ($s) => $s->update(['qr_token' => Str::uuid()->toString()]));
        }

        return [
            'success' => true,
            'message' => 'Convocations générées (QR assignés).',
            'generated_count' => $totalGenerated,
        ];
    }

    /**
     * Envoyer les emails pour toutes les convocations non envoyées.
     */
    public function sendSessionEmails(int $sessionId): array
    {
        $examIds = Exam::where('exam_session_id', $sessionId)->pluck('id');

        $seatingIds = ExamSeating::whereIn('exam_id', $examIds)
            ->whereNull('sent_at')
            ->pluck('id')
            ->toArray();

        if (empty($seatingIds)) {
            $seatingIds = ExamSeating::whereIn('exam_id', $examIds)->pluck('id')->toArray();
        }

        if (empty($seatingIds)) {
            return ['success' => false, 'message' => 'Aucune convocation à envoyer.'];
        }

        return $this->sendBatchEmails($sessionId, $seatingIds);
    }

    /**
     * Envoyer les emails par lot — un email par étudiant avec tous ses examens.
     */
    public function sendBatchEmails(int $sessionId, array $seatingIds): array
    {
        $studentIds = ExamSeating::whereIn('id', $seatingIds)->pluck('student_id')->unique();

        if ($studentIds->isEmpty()) {
            return ['success' => false, 'message' => 'Aucun étudiant sélectionné.'];
        }

        $seatings = ExamSeating::with([
            'student.user',
            'exam.module.filiere',
            'exam.examSession',
            'room',
        ])
            ->whereIn('student_id', $studentIds)
            ->orderBy('exam_id')
            ->get()
            ->groupBy('student_id');

        $sentCount = 0;

        foreach ($seatings as $studentId => $studentSeatings) {
            $first = $studentSeatings->first();
            $email = $first->student->user->email ?? null;
            if (! $email) {
                continue;
            }

            $examsData = $studentSeatings->map(fn ($s) => [
                'moduleName' => $s->exam->module->name ?? 'N/A',
                'examDate' => $s->exam->exam_date?->format('d/m/Y') ?? 'N/A',
                'examTime' => $s->exam->start_time ? substr($s->exam->start_time, 0, 5) : 'N/A',
                'roomName' => $s->room->name ?? 'N/A',
                'seatNumber' => $s->seat_number ? ('N° '.$s->seat_number) : '-',
                'professorName' => 'Prof. ENCG',
                'qrToken' => $s->qr_token,
            ])->values()->toArray();

            $qrToken = $first->qr_token ?? ('ENCG-'.($first->student->cne ?? 'STUDENT'));
            $qrCodeBase64 = $this->generateQrBase64($qrToken);

            $semNum = (int) ($first->exam->module->semester_number ?? 1);
            $niveauName = match (true) {
                $semNum <= 2 => '1ère Année',
                $semNum <= 4 => '2ème Année',
                $semNum <= 6 => '3ème Année',
                $semNum <= 8 => '4ème Année',
                default => '5ème Année',
            };

            $pdfExamsData = $studentSeatings->map(fn ($s) => [
                'date' => $s->exam->exam_date?->format('d/m/Y') ?? 'N/A',
                'time' => $s->exam->start_time ? substr($s->exam->start_time, 0, 5) : '--:--',
                'module' => $s->exam->module->name ?? 'N/A',
                'enseignant' => 'Prof. ENCG',
                'room' => $s->room->name ?? 'N/A',
                'seat' => $s->seat_number ? ('N° '.$s->seat_number) : '-',
            ])->values()->toArray();

            $pdfData = [
                'session_name' => $first->exam->examSession->name ?? 'Session d\'Examens',
                'session_type' => 'ORDINAIRE',
                'person_id' => $first->student->cne ?? 'N/A',
                'person_name' => strtoupper($first->student->user->name ?? ''),
                'filiere_name' => $first->exam->module->filiere->name ?? 'N/A',
                'niveau_name' => $niveauName,
                'exams' => $pdfExamsData,
                'qr_token' => $qrToken,
                'qrCodeBase64' => $qrCodeBase64,
            ];

            $emailData = [
                'studentName' => $first->student->user->name ?? 'Étudiant',
                'sessionName' => $first->exam->examSession->name ?? 'Session',
                'exams' => $examsData,
            ];

            try {
                $pdf = Pdf::loadView('pdf.convocation', $pdfData);

                Mail::to($email)->send(new ConvocationEmail($emailData, $pdf->output()));

                ExamSeating::whereIn('id', $studentSeatings->pluck('id'))->update(['sent_at' => now()]);
                $sentCount++;
            } catch (\Throwable $e) {
                Log::error('Erreur email convocation: '.$email.' — '.$e->getMessage());

                return ['success' => false, 'message' => 'Erreur d\'envoi pour '.$email, 'sent_count' => $sentCount];
            }
        }

        return ['success' => true, 'message' => "{$sentCount} étudiant(s) notifié(s)."];
    }

    /**
     * Envoyer les emails aux surveillants.
     */
    public function sendBatchSurveillantsEmails(int $sessionId, array $surveillanceIds): array
    {
        $session = ExamSession::with(['exams.module', 'exams.room'])->findOrFail($sessionId);
        $examIds = $session->exams->pluck('id');

        $surveillances = ExamSurveillance::with(['exam.module', 'room'])
            ->whereIn('exam_id', $examIds)
            ->whereIn('id', $surveillanceIds)
            ->get()
            ->groupBy('professor_id');

        $sentCount = 0;

        foreach ($surveillances as $professorId => $profSurveillances) {
            $professor = User::find($professorId);
            if (! $professor?->email) {
                continue;
            }

            $profExams = $profSurveillances->map(fn ($s) => [
                'moduleName' => $s->exam->module->name ?? 'N/A',
                'examDate' => $s->exam->exam_date?->format('Y-m-d') ?? 'N/A',
                'examTime' => $s->exam->start_time ?? 'N/A',
                'roomName' => $s->room->name ?? 'N/A',
                'role' => $s->role ?? 'Surveillant',
                'qrToken' => $s->qr_token,
            ])->values()->toArray();

            $profPdfExams = $profSurveillances->map(fn ($s) => [
                'date' => $s->exam->exam_date?->format('d/m/Y') ?? 'N/A',
                'time' => $s->exam->start_time ? substr($s->exam->start_time, 0, 5) : 'N/A',
                'module' => $s->exam->module->name ?? 'N/A',
                'room' => $s->room->name ?? 'N/A',
                'role' => $s->role ?? 'Surveillant',
            ])->values()->toArray();

            $professorData = [[
                'id' => $professor->id,
                'person_name' => strtoupper($professor->name),
                'filiere_name' => 'Département Enseignant',
                'person_role' => $profExams[0]['role'] ?? 'Surveillant',
                'session_name' => $session->name,
                'session_type' => '',
                'exams' => $profPdfExams,
                'qr_token' => $profExams[0]['qrToken'] ?? null,
                'qrCodeBase64' => null,
            ]];

            $emailData = [
                'professorName' => $professor->name,
                'sessionName' => $session->name,
                'exams' => $profExams,
                'confirmUrl' => url('/api/verify/surveillance/'.($profExams[0]['qrToken'] ?? '').'/confirm'),
            ];

            try {
                $pdf = Pdf::loadView('pdf.convocations_profs_batch', ['professorsData' => $professorData]);

                Mail::to($professor->email)->send(new ProfessorConvocationEmail($emailData, $pdf->output()));

                ExamSurveillance::whereIn('id', $profSurveillances->pluck('id'))->update(['sent_at' => now()]);
                $sentCount++;
            } catch (\Throwable $e) {
                Log::error('Erreur email surveillant: '.$professor->email.' — '.$e->getMessage());

                return ['success' => false, 'message' => 'Erreur d\'envoi pour '.$professor->email, 'sent_count' => $sentCount];
            }
        }

        return ['success' => true, 'message' => "{$sentCount} surveillant(s) notifié(s)."];
    }

    /**
     * Vérifier une convocation par QR token.
     */
    public function verifyByReference(string $reference): array
    {
        $seating = ExamSeating::with(['student.user', 'exam.module', 'exam.room'])
            ->where('qr_token', $reference)
            ->first();

        if (! $seating) {
            return ['success' => false, 'message' => 'Convocation introuvable.'];
        }

        return [
            'success' => true,
            'data' => [
                'student_name' => $seating->student->user->name ?? 'N/A',
                'module' => $seating->exam->module->name ?? 'N/A',
                'room' => $seating->exam->room->name ?? 'N/A',
                'date' => $seating->exam->exam_date?->format('Y-m-d') ?? 'N/A',
                'status' => $seating->is_present ? 'present' : 'absent',
            ],
        ];
    }

    /**
     * Marquer la présence par QR token.
     */
    public function markAsPresent(string $reference): array
    {
        $seating = ExamSeating::where('qr_token', $reference)->first();

        if (! $seating) {
            return ['success' => false, 'message' => 'Convocation introuvable.'];
        }

        $seating->update(['is_present' => true]);

        return ['success' => true, 'message' => 'Présence enregistrée.'];
    }

    /**
     * Scanner un QR code et marquer la présence.
     */
    public function scanQr(int $examId, string $qrToken): array
    {
        $seating = ExamSeating::where('exam_id', $examId)->where('qr_token', $qrToken)->first();

        if (! $seating) {
            return ['success' => false, 'message' => 'QR Code invalide.'];
        }

        $seating->update(['is_present' => true]);

        $student = Student::with('user')->find($seating->student_id);

        return [
            'success' => true,
            'student_name' => $student->user->name ?? 'Inconnu',
            'status' => 'present',
            'time' => now()->toTimeString(),
            'message' => 'Présence validée.',
        ];
    }

    /**
     * Statistiques en direct pour un examen.
     */
    public function getLiveStats(int $examId): array
    {
        $exam = Exam::with(['module.filiere', 'group'])->find($examId);
        $total = ExamSeating::where('exam_id', $examId)->count();
        $present = ExamSeating::where('exam_id', $examId)->where('is_present', true)->count();

        $latestScans = ExamSeating::with('student.user')
            ->where('exam_id', $examId)
            ->where('is_present', true)
            ->latest('updated_at')
            ->limit(50)
            ->get()
            ->map(fn ($s) => [
                'student_name' => $s->student->user->name ?? 'N/A',
                'scan_time' => $s->updated_at,
            ]);

        return [
            'success' => true,
            'data' => [
                'exam' => $exam ? [
                    'module_name' => $exam->module->name ?? 'N/A',
                    'filiere_name' => $exam->module->filiere->name ?? 'N/A',
                    'group_name' => $exam->group->name ?? 'N/A',
                ] : null,
                'total_students' => $total,
                'present' => $present,
                'absent' => $total - $present,
                'latest_scans' => $latestScans,
            ],
        ];
    }

    /**
     * Stats globales pour une session.
     */
    public function getGlobalLiveStats(int $sessionId): array
    {
        $session = ExamSession::with('exams')->find($sessionId);
        if (! $session) {
            return ['success' => false, 'message' => 'Session introuvable.'];
        }

        $examIds = $session->exams->pluck('id');

        $totalStudents = ExamSeating::whereIn('exam_id', $examIds)->count();
        $presentStudents = ExamSeating::whereIn('exam_id', $examIds)->where('is_present', true)->count();

        $totalSurveillants = ExamSurveillance::whereIn('exam_id', $examIds)->count();
        $confirmedSurveillants = ExamSurveillance::whereIn('exam_id', $examIds)->whereNotNull('confirmed_at')->count();

        return [
            'success' => true,
            'data' => [
                'session_name' => $session->name,
                'students' => compact('totalStudents', 'presentStudents') + ['absent' => $totalStudents - $presentStudents],
                'professors' => compact('totalSurveillants', 'confirmedSurveillants'),
            ],
        ];
    }

    /**
     * Détails d'un examen.
     */
    public function getExamDetails(int $examId): array
    {
        $exam = Exam::with(['module.filiere', 'group', 'room'])->find($examId);

        $seatings = ExamSeating::with(['student.user', 'room'])
            ->where('exam_id', $examId)
            ->orderBy('seat_number')
            ->get();

        $surveillances = ExamSurveillance::with(['professor.user', 'room'])
            ->where('exam_id', $examId)
            ->get();

        return [
            'success' => true,
            'data' => compact('exam', 'seatings', 'surveillances'),
        ];
    }

    /**
     * Stats de convocations pour une session.
     */
    public function getSessionConvocationStats(int $sessionId): array
    {
        $examIds = Exam::where('exam_session_id', $sessionId)->pluck('id');

        if ($examIds->isEmpty()) {
            return ['success' => true, 'data' => ['students' => [], 'surveillants' => []]];
        }

        $totalSeatings = ExamSeating::whereIn('exam_id', $examIds)->count();
        $generated = ExamSeating::whereIn('exam_id', $examIds)->whereNotNull('qr_token')->distinct('student_id')->count('student_id');
        $sent = ExamSeating::whereIn('exam_id', $examIds)->whereNotNull('sent_at')->distinct('student_id')->count('student_id');
        $totalStudents = ExamSeating::whereIn('exam_id', $examIds)->distinct('student_id')->count('student_id');
        $totalSurveillants = ExamSurveillance::whereIn('exam_id', $examIds)->distinct('professor_id')->count('professor_id');
        $confirmed = ExamSurveillance::whereIn('exam_id', $examIds)->whereNotNull('confirmed_at')->count();

        return [
            'success' => true,
            'data' => [
                'students' => compact('totalStudents', 'totalSeatings', 'generated', 'sent'),
                'surveillants' => compact('totalSurveillants', 'confirmed'),
            ],
        ];
    }

    /**
     * Lister les convocations d'une session.
     */
    public function getSessionConvocationsList(int $sessionId, array $filters = []): array
    {
        $examIds = Exam::where('exam_session_id', $sessionId)->pluck('id');
        if ($examIds->isEmpty()) {
            return ['success' => true, 'data' => ['students' => [], 'surveillants' => []]];
        }

        $studentsQuery = ExamSeating::with(['student.user', 'exam.module.filiere', 'room'])
            ->whereIn('exam_id', $examIds);

        if (! empty($filters['filiere'])) {
            $studentsQuery->whereHas('exam.module.filiere', fn ($q) => $q->where('code', $filters['filiere']));
        }

        $studentsList = $studentsQuery->orderBy('exam_id')->get()->map(fn ($s) => [
            'id' => $s->id,
            'student_name' => $s->student->user->name ?? 'N/A',
            'cne' => $s->student->cne ?? 'N/A',
            'filiere' => $s->exam->module->filiere->code ?? 'N/A',
            'exam_name' => $s->exam->module->name ?? 'N/A',
            'exam_date' => $s->exam->exam_date,
            'start_time' => $s->exam->start_time,
            'room_name' => $s->room->name ?? 'N/A',
            'seat_number' => $s->seat_number,
            'qr_token' => $s->qr_token,
            'sent_at' => $s->sent_at,
            'is_present' => $s->is_present,
        ]);

        $surveillantsList = ExamSurveillance::with(['professor.user', 'exam.module', 'room'])
            ->whereIn('exam_id', $examIds)
            ->orderBy('exam_id')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'professor_name' => $s->professor->name ?? 'N/A',
                'exam_name' => $s->exam->module->name ?? 'N/A',
                'room_name' => $s->room->name ?? 'N/A',
                'exam_date' => $s->exam->exam_date,
                'start_time' => $s->exam->start_time,
                'role' => $s->role,
                'has_attended' => $s->has_attended,
                'sent_at' => $s->sent_at,
                'qr_token' => $s->qr_token,
                'confirmed_at' => $s->confirmed_at,
            ]);

        return ['success' => true, 'data' => compact('studentsList', 'surveillantsList')];
    }

    // ─── Helpers ───────────────────────────────────────────────

    private function generateQrBase64(string $data): string
    {
        try {
            return base64_encode(QrCode::format('png')->size(140)->margin(1)->generate($data));
        } catch (\Throwable $e) {
            try {
                return base64_encode(QrCode::format('svg')->size(140)->margin(1)->generate($data));
            } catch (\Throwable $e2) {
                return '';
            }
        }
    }
}
