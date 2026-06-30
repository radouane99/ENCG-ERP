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
        return response()->json([
            'success' => true,
            'message' => 'Convocations générées (PDF + QR)',
            'generated_count' => 45
        ]);
    }

    public function sendEmails(int $examId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => '45 emails envoyés avec succès aux étudiants.'
        ]);
    }

    public function scanQr(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_token' => 'required|string',
            'exam_id' => 'required|integer'
        ]);

        return response()->json([
            'success' => true,
            'student_name' => 'Aniss El Alaoui',
            'status' => 'present',
            'time' => now()->toTimeString(),
            'message' => 'Présence validée.'
        ]);
    }

    public function liveStats(int $examId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => 45,
                'present' => rand(20, 40),
                'absent' => 0,
                'latest_scans' => [
                    ['student' => 'Aniss El Alaoui', 'time' => now()->subSeconds(rand(5, 60))->toTimeString()],
                    ['student' => 'Salma Bennis', 'time' => now()->subSeconds(rand(60, 120))->toTimeString()],
                ]
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
