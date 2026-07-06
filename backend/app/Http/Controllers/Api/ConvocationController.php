<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\ProctorAssignmentService;
use App\Services\Academic\ExamConvocationService;

class ConvocationController extends Controller
{
    protected ProctorAssignmentService $proctorService;
    protected ExamConvocationService $convocationService;

    public function __construct(ProctorAssignmentService $proctorService, ExamConvocationService $convocationService)
    {
        $this->proctorService = $proctorService;
        $this->convocationService = $convocationService;
    }

    public function autoAssign(int $sessionId): JsonResponse
    {
        $result = $this->proctorService->autoAssignProctors($sessionId);
        return response()->json($result);
    }

    public function generateSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|integer|exists:exam_sessions,id'
        ]);

        $result = $this->convocationService->generateSessionConvocations($validated['session_id']);
        return response()->json($result);
    }

    public function sendSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|integer|exists:exam_sessions,id'
        ]);

        $result = $this->convocationService->sendSessionEmails($validated['session_id']);
        return response()->json($result);
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
        $result = $this->convocationService->generateConvocations($examId);
        return response()->json($result);
    }

    public function sendEmails(int $examId): JsonResponse
    {
        $result = $this->convocationService->sendEmails($examId);
        return response()->json($result);
    }

    public function scanQr(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_token' => 'required|string',
            'exam_id' => 'required|integer'
        ]);

        $result = $this->convocationService->scanQr($validated['exam_id'], $validated['qr_token']);
        
        return response()->json($result, $result['success'] ? 200 : 404);
    }

    public function liveStats(int $examId): JsonResponse
    {
        $result = $this->convocationService->getLiveStats($examId);
        return response()->json($result);
    }

    public function getDetails(int $examId): JsonResponse
    {
        $result = $this->convocationService->getExamDetails($examId);
        return response()->json($result);
    }

    public function notifyAbsents(int $examId): JsonResponse
    {
        $result = $this->convocationService->notifyAbsents($examId);
        return response()->json($result);
    }

    public function uploadJustification(Request $request): JsonResponse
    {
        $request->validate([
            'exam_id' => 'required|integer',
            'certificate' => 'required|file|mimes:pdf,jpg,png|max:2048'
        ]);

        $result = $this->convocationService->uploadJustification(
            $request->input('exam_id'), 
            $request->file('certificate')
        );

        return response()->json($result);
    }

    public function getStudentConvocations(int $studentId): JsonResponse
    {
        // Mock data for student convocations based on the UI
        $convocations = [
            [ 'id' => 276, 'module' => 'Introduction - Génie Informatique', 'type' => 'CC1', 'date' => 'JUIL. 01', 'time' => '09:00 - 10:30', 'duration' => '90 min', 'room' => 'Amphi Al Khwarizmi', 'ref' => 'CONV-' . date('Y') . '-000276', 'days' => 6 ],
            [ 'id' => 277, 'module' => 'Avancé - Génie Informatique', 'type' => 'CC1', 'date' => 'JUIL. 01', 'time' => '11:00 - 12:30', 'duration' => '90 min', 'room' => 'Amphi Ibn Khaldoun', 'ref' => 'CONV-' . date('Y') . '-000277', 'days' => 6 ],
            [ 'id' => 278, 'module' => 'Développement mobile', 'type' => 'CC1', 'date' => 'JUIL. 02', 'time' => '09:00 - 10:30', 'duration' => '90 min', 'room' => 'Amphi Al Khwarizmi', 'ref' => 'CONV-' . date('Y') . '-000278', 'days' => 7 ],
        ];
        
        return response()->json([
            'success' => true,
            'data' => $convocations
        ]);
    }
}
