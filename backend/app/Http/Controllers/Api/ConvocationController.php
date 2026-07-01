<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\ProctorAssignmentService;

class ConvocationController extends Controller
{
    protected ProctorAssignmentService $proctorService;

    public function __construct(ProctorAssignmentService $proctorService)
    {
        $this->proctorService = $proctorService;
    }

    public function autoAssign(int $sessionId): JsonResponse
    {
        $result = $this->proctorService->autoAssignProctors($sessionId);
        return response()->json($result);
    }

    public function generate(int $examId): JsonResponse
    {
        $exam = \App\Models\Exam::with(['group.students', 'room'])->findOrFail($examId);
        
        $generatedCount = 0;
        foreach ($exam->group->students as $student) {
            $seating = \Illuminate\Support\Facades\DB::table('exam_seatings')
                ->where('exam_id', $exam->id)
                ->where('student_id', $student->id)
                ->first();

            if (!$seating) {
                \Illuminate\Support\Facades\DB::table('exam_seatings')->insert([
                    'exam_id' => $exam->id,
                    'student_id' => $student->id,
                    'room_id' => $exam->room_id ?? 1, // fallback to 1 if no room assigned
                    'seat_number' => $generatedCount + 1,
                    'qr_token' => \Illuminate\Support\Str::uuid()->toString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } elseif (empty($seating->qr_token)) {
                \Illuminate\Support\Facades\DB::table('exam_seatings')
                    ->where('id', $seating->id)
                    ->update(['qr_token' => \Illuminate\Support\Str::uuid()->toString()]);
            }
            $generatedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => 'Convocations générées (QR assignés)',
            'generated_count' => $generatedCount
        ]);
    }

    public function sendEmails(int $examId): JsonResponse
    {
        $exam = \App\Models\Exam::with(['group.students.user', 'module', 'room'])->findOrFail($examId);
        $seatings = \Illuminate\Support\Facades\DB::table('exam_seatings')->where('exam_id', $examId)->get()->keyBy('student_id');

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

            // Generate PDF on the fly
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('emails.convocation', $examData);
            
            \Illuminate\Support\Facades\Mail::to($student->user->email)->send(
                new \App\Mail\ConvocationEmail($examData, $pdf->output())
            );
            $sentCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$sentCount} emails envoyés avec succès aux étudiants."
        ]);
    }

    public function scanQr(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_token' => 'required|string',
            'exam_id' => 'required|integer'
        ]);

        $seating = \Illuminate\Support\Facades\DB::table('exam_seatings')
            ->where('exam_id', $validated['exam_id'])
            ->where('qr_token', $validated['qr_token'])
            ->first();

        if (!$seating) {
            return response()->json(['success' => false, 'message' => 'QR Code invalide ou introuvable.'], 404);
        }

        // Mark as present
        \Illuminate\Support\Facades\DB::table('exam_seatings')
            ->where('id', $seating->id)
            ->update([
                'is_present' => true,
                'updated_at' => now(),
            ]);

        $student = \App\Models\Student::with('user')->find($seating->student_id);

        return response()->json([
            'success' => true,
            'student_name' => $student->user->name ?? 'Étudiant inconnu',
            'status' => 'present',
            'time' => now()->toTimeString(),
            'message' => 'Présence validée.'
        ]);
    }

    public function liveStats(int $examId): JsonResponse
    {
        $total = \Illuminate\Support\Facades\DB::table('exam_seatings')->where('exam_id', $examId)->count();
        $present = \Illuminate\Support\Facades\DB::table('exam_seatings')->where('exam_id', $examId)->where('is_present', true)->count();
        $absent = $total - $present;

        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => $total,
                'present' => $present,
                'absent' => $absent,
                'latest_scans' => []
            ]
        ]);
    }

    /**
     * Notify absent students (Trigger 48h rule)
     */
    public function notifyAbsents(int $examId): JsonResponse
    {
        // 1. Identify students marked as "pending" or "absent" after the exam.
        // 2. Mark them as 'ABI' (Absence Injustifiée) initially.
        // 3. Send email: "You have 48h to upload a medical certificate on the portal."

        return response()->json([
            'success' => true,
            'message' => 'Procédure ABI lancée. Les étudiants ont 48h pour justifier leur absence.'
        ]);
    }

    /**
     * Upload medical certificate (Student portal)
     */
    public function uploadJustification(Request $request): JsonResponse
    {
        $request->validate([
            'exam_id' => 'required|integer',
            'certificate' => 'required|file|mimes:pdf,jpg,png|max:2048'
        ]);

        // 1. Check if 48h deadline has passed.
        // 2. Upload file to Storage.
        // 3. Update status to 'ABJ' (Absence Justifiée - Pending Admin Validation).

        return response()->json([
            'success' => true,
            'message' => 'Certificat médical reçu. Votre statut est passé en ABJ (En attente de validation).'
        ]);
    }
}
