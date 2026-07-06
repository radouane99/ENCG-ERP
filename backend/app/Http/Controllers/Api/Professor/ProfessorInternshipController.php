<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\EvaluateInternshipRequest;
use App\Services\Academic\SoutenanceService;
use App\Models\Internship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorInternshipController extends Controller
{
    public function __construct(private SoutenanceService $soutenanceService)
    {
    }

    public function supervised(Request $request): JsonResponse
    {
        $internships = Internship::where('professor_supervisor_id', $request->user()->id)
            ->with(['student', 'soutenance'])
            ->get();

        return response()->json(['internships' => $internships]);
    }

    public function evaluate(int $soutenanceId, EvaluateInternshipRequest $request): JsonResponse
    {
        $soutenance = $this->soutenanceService->evaluate(
            $soutenanceId,
            $request->validated('grade'),
            $request->validated('remarks')
        );

        return response()->json([
            'message' => 'Internship evaluated successfully',
            'soutenance' => $soutenance
        ]);
    }
}
