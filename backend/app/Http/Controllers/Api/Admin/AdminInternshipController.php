<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\ScheduleSoutenanceRequest;
use App\Http\Requests\Internship\ValidateInternshipRequest;
use App\Models\Internship;
use App\Models\Soutenance;
use App\Services\Academic\InternshipService;
use App\Services\Academic\SoutenanceService;
use Illuminate\Http\JsonResponse;

class AdminInternshipController extends Controller
{
    public function __construct(
        private InternshipService $internshipService,
        private SoutenanceService $soutenanceService
    ) {}

    /**
     * Liste tous les stages avec relations.
     */
    public function index(): JsonResponse
    {
        $internships = Internship::with(['student.user', 'soutenance.room'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $internships,
            'total' => $internships->count(),
        ]);
    }

    /**
     * Liste des soutenances depuis la base de données.
     */
    public function getSoutenancesList(): JsonResponse
    {
        $soutenances = Soutenance::with([
            'internship.student.user',
            'room',
            'president.user',
            'examiner.user',
        ])
            ->latest('scheduled_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $soutenances,
            'total' => $soutenances->count(),
        ]);
    }

    /**
     * Valider un stage.
     */
    public function validateInternship(int $id, ValidateInternshipRequest $request): JsonResponse
    {
        $internship = $this->internshipService->validateInternship(
            $id,
            $request->validated('status'),
            $request->validated('professor_supervisor_id')
        );

        return response()->json([
            'success' => true,
            'message' => 'Stage validé avec succès.',
            'internship' => $internship,
        ]);
    }

    /**
     * Planifier une soutenance.
     */
    public function scheduleSoutenance(ScheduleSoutenanceRequest $request): JsonResponse
    {
        $soutenance = $this->soutenanceService->schedule($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Soutenance planifiée avec succès.',
            'soutenance' => $soutenance,
        ], 201);
    }
}
