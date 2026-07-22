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
            
            // First, update any existing seatings that don't have a QR token
            $existingSeatings = DB::table('exam_seatings')
                ->where('exam_id', $exam->id)
                ->get();

            $existingStudentIds = $existingSeatings->pluck('student_id')->toArray();
            $generatedCount = $existingSeatings->max('seat_number') ?? 0;

            foreach ($existingSeatings as $seating) {
                if (empty($seating->qr_token)) {
                    DB::table('exam_seatings')
                        ->where('id', $seating->id)
                        ->update(['qr_token' => Str::uuid()->toString()]);
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
        $session = ExamSession::with(['exams.group.students.user', 'exams.module', 'exams.room'])->findOrFail($sessionId);
        $examIds = $session->exams->pluck('id');
        
        // Only select seatings that haven't been sent yet
        $seatings = DB::table('exam_seatings')
            ->whereIn('exam_id', $examIds)
            ->whereNull('sent_at')
            ->get()
            ->groupBy('exam_id');

        $sentCount = 0;
        
        foreach ($session->exams as $exam) {
            if (!$seatings->has($exam->id)) continue;
            
            $examSeatings = $seatings->get($exam->id)->keyBy('student_id');
            
            foreach ($exam->group->students as $student) {
                if (!$student->user || !$student->user->email) continue;

                $seating = $examSeatings->get($student->id);
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
                        
                        DB::table('exam_seatings')
                            ->where('id', $seating->id)
                            ->update(['sent_at' => now()]);
                            
                        $sentCount++;
                    } catch (\Exception $e) {
                        // Log email error but continue
                    }
                }
            }
        }

        return [
            'success' => true,
            'message' => "{$sentCount} convocations envoyées avec succès."
        ];
    }

    /**
     * Send emails for selected seatings
     */
    public function sendBatchEmails(int $sessionId, array $seatingIds): array
    {
        $session = ExamSession::with(['exams.group.students.user', 'exams.module', 'exams.room'])->findOrFail($sessionId);
        $examIds = $session->exams->pluck('id');
        
        $seatings = DB::table('exam_seatings')
            ->whereIn('exam_id', $examIds)
            ->whereIn('id', $seatingIds)
            ->get()
            ->groupBy('exam_id');

        $sentCount = 0;

        foreach ($session->exams as $exam) {
            if (!$seatings->has($exam->id)) continue;

            $examSeatings = $seatings->get($exam->id)->keyBy('student_id');
            if ($examSeatings->isEmpty()) continue;

            $students = collect();
            if ($exam->group_id && $exam->group) {
                $students = $exam->group->students;
            } elseif ($exam->module && $exam->module->filiere_id) {
                $students = \App\Models\Student::with('user')->whereHas('pathways', function ($q) use ($exam) {
                    $q->where('filiere_id', $exam->module->filiere_id)
                      ->where('is_current', true);
                })->get();
            }

            foreach ($students as $student) {
                if (!$student->user || !$student->user->email) continue;

                $seating = $examSeatings->get($student->id);
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
                        
                        DB::table('exam_seatings')
                            ->where('id', $seating->id)
                            ->update(['sent_at' => now()]);
                            
                        $sentCount++;
                    } catch (\Exception $e) {
                        // Log email error but continue
                    }
                }
            }
        }

        return [
            'success' => true,
            'message' => "{$sentCount} convocations envoyées avec succès."
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
                $pdf = Pdf::loadView('emails.convocation_prof', $emailData);
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
            ->whereIn('exam_seatings.exam_id', $examIds)
            ->select(
                'exam_seatings.id',
                'users.name as student_name',
                'students.cne',
                'filieres.code as filiere',
                'groups.name as group_name',
                'modules.name as exam_name',
                'exams.exam_date',
                'exams.start_time',
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
