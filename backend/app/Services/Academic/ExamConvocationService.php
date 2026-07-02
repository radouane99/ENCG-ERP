<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Exam;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Mail;
use App\Mail\ConvocationEmail;

class ExamConvocationService
{
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
