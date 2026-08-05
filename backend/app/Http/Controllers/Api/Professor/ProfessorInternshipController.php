<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\EvaluateInternshipRequest;
use App\Models\Internship;
use App\Services\Academic\SoutenanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorInternshipController extends Controller
{
    public function __construct(
        private SoutenanceService $soutenanceService
    ) {}

    /**
     * Stages supervisés par le professeur.
     */
    public function supervised(Request $request): JsonResponse
    {
        $internships = Internship::with(['student'])->get();

        return response()->json([
            'success'     => true,
            'internships' => $internships,
        ]);
    }

    /**
     * Évaluer une soutenance.
     */
    public function evaluate(int $soutenanceId, EvaluateInternshipRequest $request): JsonResponse
    {
        $soutenance = $this->soutenanceService->evaluate(
            $soutenanceId,
            $request->validated('grade'),
            $request->validated('remarks')
        );

        return response()->json([
            'success'    => true,
            'message'    => 'Soutenance évaluée avec succès.',
            'soutenance' => $soutenance,
        ]);
    }
}