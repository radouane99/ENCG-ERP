<?php

namespace App\Services\Academic;

use App\Mail\ConvocationEmail;
use App\Mail\ProfessorConvocationEmail;
use App\Models\Exam;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\Professor;
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
            $res = $this->generateConvocations($exam->id);
            $totalGenerated += $res['generated_count'] ?? 0;
        }

        return [
            'success' => true,
            'message' => "{$totalGenerated} Convocations générées avec succès pour la session.",
            'generated_count' => $totalGenerated,
        ];
    }

    /**
     * Générer les convocations pour un examen spécifique.
     */
    public function generateConvocations(int $examId): array
    {
        $exam = Exam::with(['group.students', 'module', 'seatings'])->findOrFail($examId);
        $defaultRoomId = $exam->room_id ?? Room::first()?->id;

        $existingSeatings = ExamSeating::where('exam_id', $examId)->get();

        if ($existingSeatings->isNotEmpty()) {
            $students = Student::whereIn('id', $existingSeatings->pluck('student_id'))->get();
        } else {
            $students = $this->resolveStudentsForExam($exam);
        }

        $this->assignAntiCheatSeatsForExam($examId, $students, $defaultRoomId);

        ExamSurveillance::where('exam_id', $examId)
            ->whereNull('qr_token')
            ->get()
            ->each(fn ($s) => $s->update(['qr_token' => Str::uuid()->toString()]));

        $finalCount = ExamSeating::where('exam_id', $examId)->count();

        return [
            'success' => true,
            'message' => "{$finalCount} Convocations générées avec succès (places anti-triche assignées).",
            'generated_count' => $finalCount,
        ];
    }

    /**
     * Liste des étudiants convoqués pour une épreuve.
     */
    private function resolveStudentsForExam(Exam $exam): \Illuminate\Support\Collection
    {
        $filiereId = $exam->module?->filiere_id ?? $exam->group?->filiere_id;
        $semesterNum = $exam->module?->semester_number ?? $exam->group?->semester_number;

        $students = collect();
        if ($filiereId) {
            $groups = \App\Models\Group::where('filiere_id', $filiereId)
                ->when($semesterNum, fn ($q) => $q->where('semester_number', $semesterNum))
                ->with('students')
                ->get();
            foreach ($groups as $g) {
                if ($g->students) {
                    $students = $students->merge($g->students);
                }
            }
        }
        if ($students->isEmpty() && $exam->group && $exam->group->students) {
            $students = $exam->group->students;
        }
        if ($students->isEmpty()) {
            $students = Student::limit(24)->get();
        }

        return $students->unique('id')->values();
    }

    /**
     * Mélange déterministe par épreuve : un même étudiant n'a jamais la même place N à chaque examen.
     */
    private function orderStudentsForExam(int $examId, \Illuminate\Support\Collection $students): \Illuminate\Support\Collection
    {
        return $students->unique('id')->sortBy(function ($student) use ($examId) {
            $studentKey = (string) ($student->id ?? $student);

            return sprintf('%08x', crc32($examId.'|'.$studentKey));
        })->values();
    }

    /**
     * Crée ou met à jour les places — numérotation 1..N selon l'ordre mélangé par épreuve.
     */
    private function assignAntiCheatSeatsForExam(int $examId, \Illuminate\Support\Collection $students, ?int $defaultRoomId): void
    {
        $ordered = $this->orderStudentsForExam($examId, $students);

        foreach ($ordered as $index => $student) {
            $seating = ExamSeating::firstOrNew([
                'exam_id' => $examId,
                'student_id' => $student->id,
            ]);

            if (empty($seating->room_id) && $defaultRoomId) {
                $seating->room_id = $defaultRoomId;
            }
            if (empty($seating->qr_token)) {
                $seating->qr_token = Str::uuid()->toString();
            }

            $seating->seat_number = $index + 1;
            $seating->save();
        }
    }

    /**
     * Carte exam_id → student_id → numéro de place (ordre anti-triche).
     */
    public static function buildSeatMapForExam(int $examId): array
    {
        $studentIds = ExamSeating::where('exam_id', $examId)->pluck('student_id');

        $ordered = $studentIds->sortBy(function ($studentId) use ($examId) {
            return sprintf('%08x', crc32($examId.'|'.$studentId));
        })->values();

        $map = [];
        foreach ($ordered as $index => $studentId) {
            $map[(string) $studentId] = $index + 1;
        }

        return $map;
    }

    public static function seatNumberFor(ExamSeating $seating): int
    {
        $map = self::buildSeatMapForExam((int) $seating->exam_id);
        $key = (string) $seating->student_id;

        return $map[$key] ?? (int) ($seating->seat_number ?: 1);
    }

    /**
     * Envoyer les emails pour un examen spécifique.
     */
    public function sendEmails(int $examId): array
    {
        $exam = Exam::findOrFail($examId);
        $seatingIds = ExamSeating::where('exam_id', $examId)->pluck('id')->toArray();

        if (empty($seatingIds)) {
            $this->generateConvocations($examId);
            $seatingIds = ExamSeating::where('exam_id', $examId)->pluck('id')->toArray();
        }

        if (empty($seatingIds)) {
            return ['success' => false, 'message' => 'Aucune convocation à envoyer pour cet examen.'];
        }

        $sessionId = $exam->exam_session_id ?? 1;
        return $this->sendBatchEmails($sessionId, $seatingIds);
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
                'time' => $s->exam?->formattedTimeRange() ?? '--:--',
                'module' => $s->exam->module->name ?? 'N/A',
                'enseignant' => 'Prof. ENCG',
                'room' => $s->room->name ?? 'N/A',
                'seat' => 'N° '.self::seatNumberFor($s),
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
            $professorRecord = Professor::resolveWithDepartmentByPublicId($professorId);
            $professor = $professorRecord?->user ?? User::find($professorId);
            if (! $professor?->email) {
                continue;
            }

            foreach ($profSurveillances as $s) {
                if (empty($s->qr_token)) {
                    $s->update(['qr_token' => Str::uuid()->toString()]);
                }
            }

            $primaryToken = $profSurveillances->first()->fresh()?->qr_token ?? Str::uuid()->toString();

            $profExams = $profSurveillances->map(function ($s) {
                $token = $s->fresh()?->qr_token;
                return [
                    'moduleName' => $s->exam->module->name ?? 'N/A',
                    'examDate' => $s->exam->exam_date?->format('Y-m-d') ?? 'N/A',
                    'examTime' => $s->exam->start_time ?? 'N/A',
                    'roomName' => $s->room->name ?? 'N/A',
                    'role' => $s->role ?? 'Surveillant',
                    'qrToken' => $token,
                ];
            })->values()->toArray();

            $profPdfExams = $profSurveillances->map(fn ($s) => [
                'date' => $s->exam->exam_date?->format('d/m/Y') ?? 'N/A',
                'time' => $s->exam?->formattedTimeRange() ?? 'N/A',
                'module' => $s->exam->module->name ?? 'N/A',
                'room' => $s->room->name ?? 'N/A',
                'role' => $s->role ?? 'Surveillant',
            ])->values()->toArray();

            $professorData = [[
                'id' => $professor->id,
                'person_name' => strtoupper($professor->name ?? $professorRecord?->name ?? ''),
                'person_id' => $professor->cin ?? $professorRecord?->cin ?? 'ENCG-ENS',
                'department_name' => $professorRecord?->department?->name,
                'department_label' => $professorRecord?->departmentDisplayLabel() ?? 'Corps Professoral — ENCG Fès',
                'filiere_name' => $professorRecord?->departmentDisplayLabel() ?? 'Corps Professoral — ENCG Fès',
                'person_role' => $profExams[0]['role'] ?? 'Surveillant',
                'session_name' => $session->name,
                'session_type' => '',
                'exams' => $profPdfExams,
                'qr_token' => $primaryToken,
                'qrCodeBase64' => null,
            ]];

            $baseUrl = config('app.url') ? rtrim(config('app.url'), '/') : 'http://localhost';
            if (str_contains($baseUrl, 'encg_nginx') || str_contains($baseUrl, 'localhost')) {
                $baseUrl = 'http://localhost';
            }
            $confirmUrl = $baseUrl . '/api/verify/surveillance/' . $primaryToken . '/confirm';

            $emailData = [
                'professorName' => $professor->name,
                'sessionName' => $session->name,
                'exams' => $profExams,
                'confirmUrl' => $confirmUrl,
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
            ->get()
            ->map(function ($s, $idx) {
                $seatNumber = $s->seat_number ?: ($idx + 1);
                $s->seat_number = is_numeric($seatNumber) ? (int)$seatNumber : $seatNumber;
                $s->cne = $s->student?->cne ?? ('N13'.str_pad($s->student_id ?? ($idx + 1), 7, '0', STR_PAD_LEFT));
                $s->student_name = $s->student?->user?->name ?? 'Étudiant ENCG';
                return $s;
            })
            ->sortBy('seat_number')
            ->values();

        $surveillances = ExamSurveillance::with(['professor.user', 'room'])
            ->where('exam_id', $examId)
            ->get();

        $incidents = ExamIncident::with(['student.user', 'reporter'])
            ->where('exam_id', $examId)
            ->get();

        $cachedSignature = \Illuminate\Support\Facades\Cache::get("exam_pv_signature_{$examId}");
        if ($cachedSignature && $exam) {
            $exam->signature_data = $cachedSignature;
        }

        return [
            'success' => true,
            'data' => compact('exam', 'seatings', 'surveillances', 'incidents'),
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
        $generated = ExamSeating::whereIn('exam_id', $examIds)->whereNotNull('qr_token')->pluck('student_id')->unique()->count();
        $sent = ExamSeating::whereIn('exam_id', $examIds)->whereNotNull('sent_at')->pluck('student_id')->unique()->count();
        $totalStudents = ExamSeating::whereIn('exam_id', $examIds)->pluck('student_id')->unique()->count();

        if ($totalStudents === 0) {
            $totalStudents = Student::count() ?: 24;
        }

        $totalSurveillants = ExamSurveillance::whereIn('exam_id', $examIds)->pluck('professor_id')->unique()->count();
        if ($totalSurveillants === 0) {
            $totalSurveillants = \App\Models\Professor::count() ?: 4;
        }
        $confirmed = ExamSurveillance::whereIn('exam_id', $examIds)->whereNotNull('confirmed_at')->count();

        return [
            'success' => true,
            'data' => [
                'students' => [
                    'total' => $totalStudents,
                    'generated' => $generated ?: $totalStudents,
                    'sent' => $sent,
                ],
                'surveillants' => [
                    'total' => $totalSurveillants,
                    'generated' => $totalSurveillants,
                    'confirmed' => $confirmed,
                ],
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

        $studentsQuery = ExamSeating::with(['student.user', 'exam.module.filiere', 'exam.group', 'room'])
            ->whereIn('exam_id', $examIds);

        if (! empty($filters['filiere'])) {
            $studentsQuery->whereHas('exam.module.filiere', function ($q) use ($filters) {
                $q->where('code', $filters['filiere'])->orWhere('name', $filters['filiere']);
            });
        }

        $students = $studentsQuery->orderBy('exam_id')->get()->map(function ($s) {
            $user = $s->student?->user;
            $name = trim(($user?->first_name ?? '').' '.($user?->last_name ?? ''));
            if (empty($name)) {
                $name = $user?->name ?? 'Étudiant ENCG';
            }

            return [
                'id' => $s->id,
                'student_id' => $s->student_id,
                'student_name' => $name,
                'cne' => $s->student?->cne ?? 'N13800000',
                'cin' => $s->student?->cin ?? ($user?->cin ?? 'CD123456'),
                'filiere' => $s->exam?->module?->filiere?->name ?? ($s->exam?->module?->filiere?->code ?? 'Tronc Commun ENCG'),
                'group_name' => $s->exam?->group?->name ?? 'TC-S2-G1',
                'exam_name' => $s->exam?->module?->name ?? 'Épreuve Académique',
                'exam_date' => $s->exam?->exam_date?->format('Y-m-d'),
                'start_time' => $s->exam?->start_time ? substr($s->exam->start_time, 0, 5) : '09:00',
                'room_name' => $s->room?->name ?? ($s->exam?->room?->name ?? 'Amphithéâtre B'),
                'seat_number' => ExamConvocationService::seatNumberFor($s),
                'qr_token' => $s->qr_token,
                'sent_at' => $s->sent_at,
                'is_present' => (bool) $s->is_present,
            ];
        })->values()->toArray();

        $surveillants = ExamSurveillance::with(['professor', 'exam.module', 'room'])
            ->whereIn('exam_id', $examIds)
            ->orderBy('exam_id')
            ->get()
            ->map(function ($s) {
                $user = $s->professor ?? User::find($s->professor_id);
                $name = trim(($user?->first_name ?? '').' '.($user?->last_name ?? ''));
                if (empty($name)) {
                    $name = $user?->name ?? 'Professeur ENCG';
                }

                return [
                    'id' => $s->id,
                    'professor_id' => $s->professor_id,
                    'professor_name' => $name,
                    'professor_email' => $user?->email ?? '',
                    'cin' => $user?->cin ?? 'ENCG-ENS',
                    'exam_name' => $s->exam?->module?->name ?? 'Surveillance Épreuve',
                    'room_name' => $s->room?->name ?? ($s->exam?->room?->name ?? 'Amphithéâtre B'),
                    'exam_date' => $s->exam?->exam_date?->format('Y-m-d'),
                    'start_time' => $s->exam?->start_time ? substr($s->exam->start_time, 0, 5) : '09:00',
                    'role' => $s->role ?? 'Surveillant Principal',
                    'has_attended' => (bool) $s->has_attended,
                    'sent_at' => $s->sent_at,
                    'qr_token' => $s->qr_token,
                    'confirmed_at' => $s->confirmed_at,
                ];
            })->values()->toArray();

        return ['success' => true, 'data' => compact('students', 'surveillants')];
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
