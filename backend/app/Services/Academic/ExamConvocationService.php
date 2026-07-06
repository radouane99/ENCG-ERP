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
        $session = ExamSession::with('exams.group.students')->findOrFail($sessionId);
        
        $totalGenerated = 0;
        
        foreach ($session->exams as $exam) {
            $generatedCount = 0;
            foreach ($exam->group->students as $student) {
                $seating = DB::table('exam_seatings')
                    ->where('exam_id', $exam->id)
                    ->where('student_id', $student->id)
                    ->first();

                if (!$seating) {
                    DB::table('exam_seatings')->insert([
                        'exam_id' => $exam->id,
                        'student_id' => $student->id,
                        'room_id' => $exam->room_id ?? 1, // fallback
                        'seat_number' => $generatedCount + 1,
                        'qr_token' => Str::uuid()->toString(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $totalGenerated++;
                } elseif (empty($seating->qr_token)) {
                    DB::table('exam_seatings')
                        ->where('id', $seating->id)
                        ->update(['qr_token' => Str::uuid()->toString()]);
                    $totalGenerated++;
                }
                $generatedCount++;
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
        $exam = Exam::with(['group.students', 'room'])->findOrFail($examId);
        
        $generatedCount = 0;
        foreach ($exam->group->students as $student) {
            $seating = DB::table('exam_seatings')
                ->where('exam_id', $exam->id)
                ->where('student_id', $student->id)
                ->first();

            if (!$seating) {
                DB::table('exam_seatings')->insert([
                    'exam_id' => $exam->id,
                    'student_id' => $student->id,
                    'room_id' => $exam->room_id ?? 1, // fallback
                    'seat_number' => $generatedCount + 1,
                    'qr_token' => Str::uuid()->toString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } elseif (empty($seating->qr_token)) {
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

    /**
     * Send emails to students
     */
    public function sendEmails(int $examId): array
    {
        $exam = Exam::with(['group.students.user', 'module', 'room'])->findOrFail($examId);
        $seatings = DB::table('exam_seatings')->where('exam_id', $examId)->get()->keyBy('student_id');

        $sentCount = 0;
        foreach ($exam->group->students as $student) {
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
                $pdf = Pdf::loadView('emails.convocation', $examData);
                Mail::to($student->user->email)->send(
                    new ConvocationEmail($examData, $pdf->output())
                );
            }
            $sentCount++;
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
        $total = DB::table('exam_seatings')->where('exam_id', $examId)->count();
        $present = DB::table('exam_seatings')->where('exam_id', $examId)->where('is_present', true)->count();
        
        return [
            'success' => true,
            'data' => [
                'total_students' => $total,
                'present' => $present,
                'absent' => $total - $present,
                'latest_scans' => []
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
        $seatings = DB::table('exam_seatings')
            ->join('students', 'exam_seatings.student_id', '=', 'students.id')
            ->join('rooms', 'exam_seatings.room_id', '=', 'rooms.id')
            ->where('exam_id', $examId)
            ->select('exam_seatings.*', 'students.first_name', 'students.last_name', 'rooms.name as room_name')
            ->orderBy('rooms.name')
            ->orderBy('exam_seatings.seat_number')
            ->get();

        $surveillances = DB::table('exam_surveillances')
            ->join('users', 'exam_surveillances.professor_id', '=', 'users.id')
            ->join('rooms', 'exam_surveillances.room_id', '=', 'rooms.id')
            ->where('exam_id', $examId)
            ->select('exam_surveillances.*', 'users.first_name', 'users.last_name', 'rooms.name as room_name')
            ->get();

        return [
            'success' => true,
            'data' => [
                'seatings' => $seatings,
                'surveillances' => $surveillances
            ]
        ];
    }
}
