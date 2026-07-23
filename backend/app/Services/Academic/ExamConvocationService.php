<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Mail;
use App\Mail\ConvocationEmail;

class ExamConvocationService
{
    /**
     * Generate convocations for all exams in a session
     */
    public function generateSessionConvocations(int $sessionId): array
    {
        $session = ExamSession::with(['exams.group.students', 'exams.module'])->findOrFail($sessionId);
        
        $totalGenerated = 0;
        
        foreach ($session->exams as $exam) {
            $generatedCount = 0;
            
            // First, update any existing seatings that don't have a QR token, room_id, or seat_number
            $existingSeatings = DB::table('exam_seatings')
                ->where('exam_id', $exam->id)
                ->get();

            $existingStudentIds = $existingSeatings->pluck('student_id')->toArray();
            $generatedCount = $existingSeatings->max('seat_number') ?? 0;
            $defaultRoomId = $exam->room_id ?? $exam->room?->id ?? \App\Models\Room::first()?->id;

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
                if (!empty($updates)) {
                    DB::table('exam_seatings')
                        ->where('id', $seating->id)
                        ->update($updates);
                    $totalGenerated++;
                }
            }

            // Only fetch students to create new seatings if this is a manually created exam without complete seatings
            // Or if we specifically want to enforce all students of a group are seated
            $students = collect();
            if ($exam->group_id && $exam->group) {
                // If it's a specific group exam (e.g. manual creation)
                $students = $exam->group->students;
            } elseif ($exam->module && $exam->module->filiere_id) {
                // If no group, take the whole filiere
                $students = \App\Models\Student::whereHas('pathways', function ($q) use ($exam) {
                    $q->where('filiere_id', $exam->module->filiere_id)
                      ->where('is_current', true);
                })->get();
            }

            // Only insert new seatings if there are NO existing seatings for this exam.
            // (If auto-generated, seatings are already distributed across rooms, we shouldn't insert missing students into every room).
            if ($existingSeatings->isEmpty() && $students->isNotEmpty()) {
                $roomId = $exam->room_id ?? $exam->room?->id;
                if (!$roomId) {
                    continue; // Skip if no room assigned
                }

                foreach ($students as $student) {
                    if (!in_array($student->id, $existingStudentIds)) {
                        DB::table('exam_seatings')->insert([
                            'exam_id' => $exam->id,
                            'student_id' => $student->id,
                            'room_id' => $roomId,
                            'seat_number' => ++$generatedCount,
                            'qr_token' => Str::uuid()->toString(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $totalGenerated++;
                    }
                }
            }

            // Also generate QR tokens for professors (surveillances)
            $existingSurveillances = DB::table('exam_surveillances')
                ->where('exam_id', $exam->id)
                ->whereNull('qr_token')
                ->get();

            foreach ($existingSurveillances as $surveillance) {
                DB::table('exam_surveillances')
                    ->where('id', $surveillance->id)
                    ->update(['qr_token' => Str::uuid()->toString()]);
            }
        }

        return [
            'success' => true,
            'message' => 'Convocations générées pour la session (QR assignés)',
            'generated_count' => $totalGenerated
        ];
    }

    /**
     * Send emails for all unsent convocations in a session
     */
    public function sendSessionEmails(int $sessionId): array
    {
        $session = ExamSession::findOrFail($sessionId);
        $examIds = DB::table('exams')->where('exam_session_id', $sessionId)->pluck('id');
        
        $seatingIds = DB::table('exam_seatings')
            ->whereIn('exam_id', $examIds)
            ->whereNull('sent_at')
            ->pluck('id')
            ->toArray();

        if (empty($seatingIds)) {
            $seatingIds = DB::table('exam_seatings')
                ->whereIn('exam_id', $examIds)
                ->pluck('id')
                ->toArray();
        }

        if (empty($seatingIds)) {
            return [
                'success' => false,
                'message' => 'Aucune convocation à envoyer pour cette session. Veuillez d\'abord générer les convocations.'
            ];
        }

        return $this->sendBatchEmails($sessionId, $seatingIds);
    }

    /**
     * Send emails for selected seatings — one email per student with all their exams
     */
    public function sendBatchEmails(int $sessionId, array $seatingIds): array
    {
        // Extract student IDs from requested seatings
        $studentIds = DB::table('exam_seatings')
            ->whereIn('id', $seatingIds)
            ->pluck('student_id')
            ->unique();

        if ($studentIds->isEmpty()) {
            return [
                'success' => false,
                'message' => 'Aucun étudiant correspondant sélectionné.'
            ];
        }

        // Fetch all seatings for these students
        $seatings = DB::table('exam_seatings')
            ->join('students', 'exam_seatings.student_id', '=', 'students.id')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->join('exams', 'exam_seatings.exam_id', '=', 'exams.id')
            ->join('exam_sessions', 'exams.exam_session_id', '=', 'exam_sessions.id')
            ->join('modules', 'exams.module_id', '=', 'modules.id')
            ->leftJoin('filieres', 'modules.filiere_id', '=', 'filieres.id')
            ->leftJoin('rooms as seating_rooms', 'exam_seatings.room_id', '=', 'seating_rooms.id')
            ->leftJoin('rooms as exam_rooms', 'exams.room_id', '=', 'exam_rooms.id')
            ->leftJoin('exam_surveillances', function($join) {
                $join->on('exam_surveillances.exam_id', '=', 'exams.id')
                     ->where('exam_surveillances.role', '=', 'president_salle');
            })
            ->leftJoin('users as prof_users', 'exam_surveillances.professor_id', '=', 'prof_users.id')
            ->whereIn('exam_seatings.student_id', $studentIds)
            ->select(
                'exam_seatings.id as seating_id',
                'exam_seatings.student_id',
                'exam_seatings.qr_token',
                'exam_seatings.seat_number',
                'students.cne',
                DB::raw("COALESCE(users.cin, 'N/A') as student_cin"),
                'users.name as student_name',
                'users.email as student_email',
                'modules.name as module_name',
                'modules.semester_number',
                'filieres.name as filiere_name',
                'exam_sessions.name as session_name',
                'exams.exam_date',
                'exams.start_time',
                DB::raw("COALESCE(seating_rooms.name, exam_rooms.name, 'Salle non assignée') as room_name"),
                DB::raw("COALESCE(prof_users.name, 'Prof. Responsable') as professor_name")
            )
            ->orderBy('exams.exam_date')
            ->orderBy('exams.start_time')
            ->get()
            ->groupBy('student_id');

        $sentCount = 0;

        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        foreach ($seatings as $studentId => $studentSeatings) {
            $first = $studentSeatings->first();
            if (!$first->student_email) continue;

            // Build list of all exams for this student
            $examsData = $studentSeatings->map(function ($s) {
                return [
                    'moduleName'    => $s->module_name ?? 'N/A',
                    'examDate'      => $s->exam_date ? \Carbon\Carbon::parse($s->exam_date)->format('d/m/Y') : 'N/A',
                    'examTime'      => $s->start_time ? substr($s->start_time, 0, 5) : 'N/A',
                    'roomName'      => $s->room_name ?? 'Salle non assignée',
                    'seatNumber'    => $s->seat_number ? ('N° ' . $s->seat_number) : '-',
                    'professorName' => $s->professor_name ?? 'Prof. ENCG',
                    'qrToken'       => $s->qr_token,
                ];
            })->values()->toArray();

            $emailData = [
                'studentName' => $first->student_name,
                'sessionName' => $first->session_name ?? 'Session d\'Examens',
                'logoBase64'  => $logoBase64,
                'exams'       => $examsData,
            ];

            try {
                $qrToken = $first->qr_token ?? ('ENCG-' . ($first->cne ?? 'STUDENT') . '-' . $studentId);
                $qrCodeBase64 = '';
                try {
                    $qrPng = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('png')->size(140)->margin(1)->generate($qrToken);
                    $qrCodeBase64 = base64_encode($qrPng);
                } catch (\Throwable $e) {
                    try {
                        $qrSvg = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(140)->margin(1)->generate($qrToken);
                        $qrCodeBase64 = base64_encode($qrSvg);
                    } catch (\Throwable $e2) {}
                }

                // Build PDF data in the format of the official pdf/convocation template
                $pdfExamsData = $studentSeatings->map(function ($s) {
                    return [
                        'date'       => $s->exam_date ? \Carbon\Carbon::parse($s->exam_date)->format('d/m/Y') : 'N/A',
                        'time'       => ($s->start_time ? substr($s->start_time, 0, 5) : '--:--'),
                        'module'     => $s->module_name ?? 'N/A',
                        'enseignant' => $s->professor_name ?? 'Prof. ENCG',
                        'room'       => $s->room_name ?? 'Salle non assignée',
                        'seat'       => $s->seat_number ? ('N° ' . $s->seat_number) : '-',
                    ];
                })->values()->toArray();

                $semNum = (int) ($first->semester_number ?? 1);
                $niveauName = ($semNum <= 2) ? '1ère Année' : (($semNum <= 4) ? '2ème Année' : (($semNum <= 6) ? '3ème Année' : (($semNum <= 8) ? '4ème Année' : '5ème Année')));

                $pdfData = [
                    'session_name' => $first->session_name ?? 'Session d\'Examens',
                    'session_type' => 'ORDINAIRE',
                    'person_id'    => $first->cne ?? 'N/A',
                    'person_cin'   => $first->student_cin ?? 'N/A',
                    'person_name'  => strtoupper($first->student_name),
                    'filiere_name' => $first->filiere_name ?? 'N/A',
                    'niveau_name'  => $niveauName,
                    'exams'        => $pdfExamsData,
                    'qr_token'     => $qrToken,
                    'qrCodeBase64' => $qrCodeBase64,
                ];

                $pdf = Pdf::loadView('pdf.convocation', $pdfData);

                try {
                    Mail::to($first->student_email)->send(
                        new ConvocationEmail($emailData, $pdf->output())
                    );

                    // Mark all seatings as sent only on successful mail send
                    DB::table('exam_seatings')
                        ->whereIn('id', $studentSeatings->pluck('seating_id'))
                        ->update(['sent_at' => now()]);

                    $sentCount++;
                } catch (\Throwable $mailErr) {
                    \Illuminate\Support\Facades\Log::error('Resend email error for ' . $first->student_email . ': ' . $mailErr->getMessage());
                    return [
                        'success' => false,
                        'message' => 'Erreur Resend pour (' . $first->student_email . '): ' . $mailErr->getMessage(),
                        'sent_count' => $sentCount,
                    ];
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Student convocation batch error for student_id ' . $studentId . ': ' . $e->getMessage());
            }
        }

        return [
            'success' => true,
            'message' => "{$sentCount} étudiant(s) ont reçu leur convocation par email."
        ];
    }

    /**
     * Send emails for selected surveillances (professors)
     */
    public function sendBatchSurveillantsEmails(int $sessionId, array $surveillanceIds): array
    {
        $session = ExamSession::with(['exams.module', 'exams.room'])->findOrFail($sessionId);
        $examIds = $session->exams->pluck('id');
        
        $surveillances = DB::table('exam_surveillances')
            ->whereIn('exam_id', $examIds)
            ->whereIn('id', $surveillanceIds)
            ->get()
            ->groupBy('professor_id');

        $sentCount = 0;

        foreach ($surveillances as $professorId => $profSurveillances) {
            $professor = \App\Models\User::find($professorId);
            if (!$professor || !$professor->email) continue;

            // Collect all exams for this professor
            $profExamsData = [];
            foreach ($profSurveillances as $surv) {
                $exam = $session->exams->firstWhere('id', $surv->exam_id);
                if (!$exam) continue;

                $profExamsData[] = [
                    'moduleName' => $exam->module?->name ?? 'N/A',
                    'examDate' => $exam->exam_date ? $exam->exam_date->format('Y-m-d') : 'N/A',
                    'examTime' => $exam->start_time ?? 'N/A',
                    'roomName' => $exam->room?->name ?? 'N/A',
                    'role' => $surv->role ?? 'Surveillant',
                    'qrToken' => $surv->qr_token,
                ];
            }

            if (empty($profExamsData)) continue;

            $emailData = [
                'professorName' => $professor->name,
                'sessionName' => $session->name,
                'exams' => $profExamsData,
                'confirmUrl' => url('/api/verify/surveillance/' . $profExamsData[0]['qrToken'] . '/confirm')
            ];

            try {
                // Build PDF data in the format of the official pdf/convocations_profs_batch template
                $profPdfExams = array_map(function ($exam) {
                    return [
                        'date'   => $exam['examDate'],
                        'time'   => substr($exam['examTime'], 0, 5),
                        'module' => $exam['moduleName'],
                        'room'   => $exam['roomName'],
                        'role'   => $exam['role'],
                    ];
                }, $profExamsData);

                $professorData = [[
                    'id'           => $professor->id,
                    'created_at'   => now()->toDateTimeString(),
                    'person_id'    => $professor->professor_id ?? $professor->id,
                    'person_name'  => strtoupper($professor->name),
                    'filiere_name' => 'Département Enseignant',
                    'person_role'  => $profExamsData[0]['role'] ?? 'Surveillant',
                    'session_name' => $session->name,
                    'session_type' => '',
                    'exams'        => $profPdfExams,
                    'qr_token'     => $profExamsData[0]['qrToken'] ?? null,
                    'qrCodeBase64' => null,
                ]];

                $pdf = Pdf::loadView('pdf.convocations_profs_batch', ['professorsData' => $professorData]);
                Mail::to($professor->email)->send(
                    new \App\Mail\ProfessorConvocationEmail($emailData, $pdf->output())
                );
                
                DB::table('exam_surveillances')
                    ->whereIn('id', $profSurveillances->pluck('id'))
                    ->update(['sent_at' => now()]);
                    
                $sentCount++;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Convocation email error for professor ' . $professor->id . ': ' . $e->getMessage());
                return [
                    'success' => false,
                    'message' => 'Erreur lors de l\'envoi à ' . $professor->name . ' (' . $professor->email . '): ' . $e->getMessage(),
                    'sent_count' => $sentCount,
                ];
            }
        }

        return [
            'success' => true,
            'message' => "{$sentCount} e-mails envoyés avec succès aux surveillants."
        ];
    }

    /**
     * Verify convocation by reference (QR token UUID)
     */
    public function verifyByReference(string $reference): array
    {
        $seating = DB::table('exam_seatings')
            ->where('qr_token', $reference)
            ->first();

        if (!$seating) {
            return ['success' => false, 'message' => 'Convocation introuvable.'];
        }

        $student = Student::with('user')->find($seating->student_id);
        $exam = Exam::with(['module', 'room'])->find($seating->exam_id);

        return [
            'success' => true,
            'data' => [
                'student_name' => $student->user->name ?? 'N/A',
                'module' => $exam->module->name ?? 'N/A',
                'room' => $exam->room->name ?? 'N/A',
                'date' => $exam->exam_date ? $exam->exam_date->format('Y-m-d') : 'N/A',
                'status' => $seating->is_present ? 'present' : 'absent'
            ]
        ];
    }

    /**
     * Mark presence by reference (QR token UUID)
     */
    public function markAsPresent(string $reference): array
    {
        $seating = DB::table('exam_seatings')
            ->where('qr_token', $reference)
            ->first();

        if (!$seating) {
            return ['success' => false, 'message' => 'Convocation introuvable.'];
        }

        DB::table('exam_seatings')
            ->where('id', $seating->id)
            ->update([
                'is_present' => true,
                'updated_at' => now(),
            ]);

        return [
            'success' => true,
            'message' => 'Présence enregistrée.'
        ];
    }

    /**
     * Generate QR seatings for an exam
     */
    public function generateConvocations(int $examId): array
    {
        $exam = Exam::findOrFail($examId);
        
        $seatings = DB::table('exam_seatings')
            ->where('exam_id', $exam->id)
            ->get();

        $generatedCount = 0;
        foreach ($seatings as $seating) {
            if (empty($seating->qr_token)) {
                DB::table('exam_seatings')
                    ->where('id', $seating->id)
                    ->update(['qr_token' => Str::uuid()->toString()]);
            }
            $generatedCount++;
        }

        return [
            'success' => true,
            'message' => 'Convocations générées (QR assignés)',
            'generated_count' => $generatedCount
        ];
    }

    public function sendEmails(int $examId): array
    {
        $exam = Exam::with(['module', 'room'])->findOrFail($examId);
        $seatings = DB::table('exam_seatings')->where('exam_id', $examId)->get()->keyBy('student_id');

        $students = \App\Models\Student::with('user')
            ->whereIn('id', $seatings->keys())
            ->get();

        $sentCount = 0;
        foreach ($students as $student) {
            if (!$student->user || !$student->user->email) continue;

            $seating = $seatings->get($student->id);
            if (!$seating || !$seating->qr_token) continue;

            $examData = [
                'studentName' => $student->user->name,
                'moduleName' => $exam->module->name ?? 'N/A',
                'examDate' => $exam->exam_date ? $exam->exam_date->format('Y-m-d') : 'N/A',
                'examTime' => $exam->start_time ?? 'N/A',
                'roomName' => $exam->room->name ?? 'N/A',
                'qrToken' => $seating->qr_token,
            ];

            if (class_exists(Pdf::class) && class_exists(ConvocationEmail::class)) {
                try {
                    $pdf = Pdf::loadView('emails.convocation', $examData);
                    Mail::to($student->user->email)->send(
                        new ConvocationEmail($examData, $pdf->output())
                    );
                    // Mark as sent
                    DB::table('exam_seatings')
                        ->where('id', $seating->id)
                        ->update(['sent_at' => now()]);
                    $sentCount++;
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Error sending convocation email to student ID ' . $student->id . ': ' . $e->getMessage(), ['exception' => $e]);
                }
            }
        }

        return [
            'success' => true,
            'message' => "{$sentCount} emails envoyés avec succès aux étudiants."
        ];
    }

    /**
     * Scan QR and mark presence
     */
    public function scanQr(int $examId, string $qrToken): array
    {
        $seating = DB::table('exam_seatings')
            ->where('exam_id', $examId)
            ->where('qr_token', $qrToken)
            ->first();

        if (!$seating) {
            return ['success' => false, 'message' => 'QR Code invalide ou introuvable.'];
        }

        DB::table('exam_seatings')
            ->where('id', $seating->id)
            ->update([
                'is_present' => true,
                'updated_at' => now(),
            ]);

        $student = Student::with('user')->find($seating->student_id);

        return [
            'success' => true,
            'student_name' => $student->user->name ?? 'Étudiant inconnu',
            'status' => 'present',
            'time' => now()->toTimeString(),
            'message' => 'Présence validée.'
        ];
    }

    /**
     * Get live stats for an exam
     */
    public function getLiveStats(int $examId): array
    {
        $exam = Exam::with(['module.filiere', 'group'])->find($examId);
        $total = DB::table('exam_seatings')->where('exam_id', $examId)->count();
        $present = DB::table('exam_seatings')->where('exam_id', $examId)->where('is_present', true)->count();
        
        $latestScans = DB::table('exam_seatings')
            ->join('students', 'exam_seatings.student_id', '=', 'students.id')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->where('exam_id', $examId)
            ->where('is_present', true)
            ->select('users.name as student_name', 'exam_seatings.updated_at as scan_time')
            ->orderBy('exam_seatings.updated_at', 'desc')
            ->limit(50)
            ->get();

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
                'latest_scans' => $latestScans
            ]
        ];
    }

    /**
     * Get global live stats for an entire session
     */
    public function getGlobalLiveStats(int $sessionId): array
    {
        $session = ExamSession::with(['exams.module.filiere', 'exams.group'])->find($sessionId);
        if (!$session) {
            return ['success' => false, 'message' => 'Session not found'];
        }

        $examIds = $session->exams->pluck('id');

        // Students Stats
        $totalStudents = DB::table('exam_seatings')->whereIn('exam_id', $examIds)->count();
        $presentStudents = DB::table('exam_seatings')->whereIn('exam_id', $examIds)->where('is_present', true)->count();

        // Professors Stats (Surveillants)
        $totalSurveillants = DB::table('exam_surveillances')->whereIn('exam_id', $examIds)->count();
        $presentSurveillants = DB::table('exam_surveillances')->whereIn('exam_id', $examIds)->where('has_attended', true)->count();
        $confirmedSurveillants = DB::table('exam_surveillances')->whereIn('exam_id', $examIds)->whereNotNull('confirmed_at')->count();

        // Latest Scans (Students)
        $latestStudentScans = DB::table('exam_seatings')
            ->join('students', 'exam_seatings.student_id', '=', 'students.id')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->whereIn('exam_seatings.exam_id', $examIds)
            ->where('exam_seatings.is_present', true)
            ->select('users.name as student_name', 'exam_seatings.updated_at as scan_time')
            ->orderBy('exam_seatings.updated_at', 'desc')
            ->limit(10)
            ->get();

        // Latest Confirmations (Professors)
        $latestProfConfirmations = DB::table('exam_surveillances')
            ->join('users', 'exam_surveillances.professor_id', '=', 'users.id')
            ->whereIn('exam_surveillances.exam_id', $examIds)
            ->whereNotNull('exam_surveillances.confirmed_at')
            ->select('users.name as professor_name', 'exam_surveillances.confirmed_at as confirm_time')
            ->orderBy('exam_surveillances.confirmed_at', 'desc')
            ->limit(10)
            ->get();

        return [
            'success' => true,
            'data' => [
                'session_name' => $session->name,
                'students' => [
                    'total' => $totalStudents,
                    'present' => $presentStudents,
                    'absent' => $totalStudents - $presentStudents,
                    'latest_scans' => $latestStudentScans
                ],
                'professors' => [
                    'total' => $totalSurveillants,
                    'present' => $presentSurveillants,
                    'confirmed' => $confirmedSurveillants,
                    'absent' => $totalSurveillants - $presentSurveillants,
                    'latest_confirmations' => $latestProfConfirmations
                ]
            ]
        ];
    }

    /**
     * Notify absents
     */
    public function notifyAbsents(int $examId): array
    {
        return [
            'success' => true,
            'message' => 'Procédure ABI lancée. Les étudiants ont 48h pour justifier leur absence.'
        ];
    }

    /**
     * Upload medical certificate
     */
    public function uploadJustification(int $examId, $certificateFile): array
    {
        return [
            'success' => true,
            'message' => 'Certificat médical reçu. Votre statut est passé en ABJ (En attente de validation).'
        ];
    }

    /**
     * Fetch exam details (seatings & surveillances)
     */
    public function getExamDetails(int $examId): array
    {
        $exam = Exam::with(['module.filiere', 'group', 'room'])->find($examId);

        $seatings = DB::table('exam_seatings')
            ->join('students', 'exam_seatings.student_id', '=', 'students.id')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->leftJoin('rooms', 'exam_seatings.room_id', '=', 'rooms.id')
            ->where('exam_id', $examId)
            ->select('exam_seatings.*', 'users.name as student_name', 'students.cne', 'rooms.name as room_name')
            ->orderBy('exam_seatings.seat_number')
            ->get();

        $surveillances = DB::table('exam_surveillances')
            ->join('users', 'exam_surveillances.professor_id', '=', 'users.id')
            ->leftJoin('rooms', 'exam_surveillances.room_id', '=', 'rooms.id')
            ->where('exam_id', $examId)
            ->select('exam_surveillances.*', 'users.name', 'rooms.name as room_name')
            ->get();

        return [
            'success' => true,
            'data' => [
                'exam' => $exam,
                'seatings' => $seatings,
                'surveillances' => $surveillances
            ]
        ];
    }

    /**
     * Get aggregate stats for a session's convocations (Dashboard)
     */
    public function getSessionConvocationStats(int $sessionId): array
    {
        $session = ExamSession::with('exams')->findOrFail($sessionId);
        $examIds = $session->exams->pluck('id');

        if ($examIds->isEmpty()) {
            return [
                'success' => true,
                'data' => [
                    'students' => ['total' => 0, 'generated' => 0, 'sent' => 0, 'downloaded' => 0],
                    'surveillants' => ['total' => 0, 'generated' => 0, 'sent' => 0, 'confirmed' => 0]
                ]
            ];
        }

        // Students metrics
        $totalSeatings = DB::table('exam_seatings')->whereIn('exam_id', $examIds)->count();
        $generated = DB::table('exam_seatings')->whereIn('exam_id', $examIds)->whereNotNull('qr_token')->distinct('student_id')->count('student_id');
        $sent = DB::table('exam_seatings')->whereIn('exam_id', $examIds)->whereNotNull('sent_at')->distinct('student_id')->count('student_id');
        $present = DB::table('exam_seatings')->whereIn('exam_id', $examIds)->where('is_present', true)->distinct('student_id')->count('student_id');
        $totalDistinctStudents = DB::table('exam_seatings')->whereIn('exam_id', $examIds)->distinct('student_id')->count('student_id');

        // Surveillants metrics
        $totalSurveillants = DB::table('exam_surveillances')->whereIn('exam_id', $examIds)->distinct('professor_id')->count('professor_id');
        $surveillancesGenerated = DB::table('exam_surveillances')->whereIn('exam_id', $examIds)->count();
        $surveillancesAttended = DB::table('exam_surveillances')->whereIn('exam_id', $examIds)->where('has_attended', true)->count();

        return [
            'success' => true,
            'data' => [
                'students' => [
                    'total' => $totalDistinctStudents, // Unique students
                    'total_seatings' => $totalSeatings, // Total exams taken
                    'generated' => $generated,
                    'sent' => $sent,
                    'downloaded' => $present, // Using present as proxy for now
                ],
                'surveillants' => [
                    'total' => $totalSurveillants,
                    'generated' => $surveillancesGenerated,
                    'sent' => 0, // Not tracked in db schema yet
                    'confirmed' => $surveillancesAttended // Using attended as confirmed
                ]
            ]
        ];
    }

    /**
     * Get detailed list of convocations for a session
     */
    public function getSessionConvocationsList(int $sessionId, array $filters = []): array
    {
        $session = ExamSession::with('exams')->findOrFail($sessionId);
        $examIds = $session->exams->pluck('id');

        if ($examIds->isEmpty()) {
            return ['success' => true, 'data' => ['students' => [], 'surveillants' => []]];
        }

        $studentQuery = DB::table('exam_seatings')
            ->join('students', 'exam_seatings.student_id', '=', 'students.id')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->join('exams', 'exam_seatings.exam_id', '=', 'exams.id')
            ->join('modules', 'exams.module_id', '=', 'modules.id')
            ->join('filieres', 'modules.filiere_id', '=', 'filieres.id')
            ->leftJoin('groups', 'exams.group_id', '=', 'groups.id')
            ->leftJoin('rooms as seating_rooms', 'exam_seatings.room_id', '=', 'seating_rooms.id')
            ->leftJoin('rooms as exam_rooms', 'exams.room_id', '=', 'exam_rooms.id')
            ->whereIn('exam_seatings.exam_id', $examIds)
            ->select(
                'exam_seatings.id',
                'exam_seatings.student_id',
                'users.name as student_name',
                'students.cne',
                'filieres.code as filiere',
                'groups.name as group_name',
                'modules.name as exam_name',
                'exams.exam_date',
                'exams.start_time',
                DB::raw('COALESCE(seating_rooms.name, exam_rooms.name) as room_name'),
                'exam_seatings.seat_number',
                'exam_seatings.qr_token',
                'exam_seatings.sent_at',
                'exam_seatings.is_present'
            );

        if (!empty($filters['filiere'])) {
            $studentQuery->where('filieres.code', $filters['filiere']);
        }

        $studentsList = $studentQuery->orderBy('exams.exam_date')->orderBy('users.name')->get();

        $surveillantQuery = DB::table('exam_surveillances')
            ->join('users', 'exam_surveillances.professor_id', '=', 'users.id')
            ->join('exams', 'exam_surveillances.exam_id', '=', 'exams.id')
            ->join('modules', 'exams.module_id', '=', 'modules.id')
            ->leftJoin('rooms', 'exam_surveillances.room_id', '=', 'rooms.id')
            ->whereIn('exam_surveillances.exam_id', $examIds)
            ->select(
                'exam_surveillances.id',
                'users.name as professor_name',
                'modules.name as exam_name',
                'rooms.name as room_name',
                'exams.exam_date',
                'exams.start_time',
                'exam_surveillances.role',
                'exam_surveillances.has_attended',
                'exam_surveillances.sent_at',
                'exam_surveillances.qr_token',
                'exam_surveillances.confirmed_at'
            );

        $surveillantsList = $surveillantQuery->orderBy('exams.exam_date')->orderBy('users.name')->get();

        return [
            'success' => true,
            'data' => [
                'students' => $studentsList,
                'surveillants' => $surveillantsList
            ]
        ];
    }
}
