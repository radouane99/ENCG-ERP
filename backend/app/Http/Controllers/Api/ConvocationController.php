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
}
