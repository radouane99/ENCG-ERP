<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exams\GenerateConvocationsRequest;
use App\Services\Academic\ExamSchedulingService;
use App\Models\Exam;
use App\Models\Convocation;
use Illuminate\Http\JsonResponse;

class AdminExamConvocationController extends Controller
{
    public function __construct(private ExamSchedulingService $schedulingService)
    {
    }

    public function index(int $examId): JsonResponse
    {
        $convocations = Convocation::where('exam_id', $examId)
            ->with(['student', 'room'])
            ->get();
            
        return response()->json(['convocations' => $convocations]);
    }

    public function generate(int $examId, GenerateConvocationsRequest $request): JsonResponse
    {
        $count = $this->schedulingService->generateConvocations(
            $examId,
            $request->validated('room_id')
        );

        return response()->json([
            'message' => "$count convocations generated successfully."
        ], 201);
    }

    public function publish(int $examId): JsonResponse
    {
        $count = $this->schedulingService->publishConvocations($examId);

        return response()->json([
            'message' => "$count convocations published successfully."
        ]);
    }
}
