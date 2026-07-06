<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Academic\AbsenceWorkflowService;
use App\Http\Requests\Academic\ReviewJustificationRequest;
use Illuminate\Http\JsonResponse;

class AdminAbsenceController extends Controller
{
    public function __construct(private AbsenceWorkflowService $workflowService)
    {
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'stats' => $this->workflowService->getGlobalAbsenceStats()
        ]);
    }

    public function review(int $justificationId, ReviewJustificationRequest $request): JsonResponse
    {
        $justification = $this->workflowService->reviewJustification(
            $justificationId,
            $request->validated('status'),
            $request->user()->id,
            $request->validated('rejection_reason')
        );

        return response()->json([
            'message' => 'Justification reviewed successfully',
            'justification' => $justification
        ]);
    }
}
