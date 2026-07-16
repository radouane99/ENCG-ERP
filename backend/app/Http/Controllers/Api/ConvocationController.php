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



    public function getStudentConvocations(int $studentId): JsonResponse
    {
        $seatings = \App\Models\ExamSeating::with(['exam.module', 'room'])
            ->where('student_id', $studentId)
            ->whereNotNull('sent_at') // Only show if they have been sent/published
            ->get();

        $convocations = $seatings->map(function ($seating) {
            $exam = $seating->exam;
            return [
                'id' => $seating->id,
                'module' => $exam->module->name ?? 'N/A',
                'type' => $exam->type ?? 'CC1',
                'date' => $exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->isoFormat('MMM DD') : 'N/A',
                'time' => $exam->start_time . ' - ' . \Carbon\Carbon::parse($exam->start_time)->addMinutes($exam->duration_minutes)->format('H:i'),
                'duration' => $exam->duration_minutes . ' min',
                'room' => $seating->room->name ?? 'N/A',
                'ref' => $seating->qr_token,
                'days' => $exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->diffInDays(now()) : 0,
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $convocations
        ]);
    }
}
