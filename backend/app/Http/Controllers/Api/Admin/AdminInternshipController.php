<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\ValidateInternshipRequest;
use App\Http\Requests\Internship\ScheduleSoutenanceRequest;
use App\Services\Academic\InternshipService;
use App\Services\Academic\SoutenanceService;
use App\Models\Internship;
use Illuminate\Http\JsonResponse;

class AdminInternshipController extends Controller
{
    public function __construct(
        private InternshipService $internshipService,
        private SoutenanceService $soutenanceService
    ) {}

    public function index(): JsonResponse
    {
        $internships = Internship::with(['student', 'soutenance'])->latest()->get();
        return response()->json(['internships' => $internships]);
    }

    public function validateInternship(int $id, ValidateInternshipRequest $request): JsonResponse
    {
        $internship = $this->internshipService->validateInternship(
            $id,
            $request->validated('status'),
            $request->validated('professor_supervisor_id')
        );

        return response()->json([
            'message' => 'Internship validated successfully',
            'internship' => $internship
        ]);
    }

    public function scheduleSoutenance(ScheduleSoutenanceRequest $request): JsonResponse
    {
        $soutenance = $this->soutenanceService->schedule($request->validated());

        return response()->json([
            'message' => 'Soutenance scheduled successfully',
            'soutenance' => $soutenance
        ], 201);
    }
}
