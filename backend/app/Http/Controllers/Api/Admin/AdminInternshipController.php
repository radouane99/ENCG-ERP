<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\InternshipStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\ScheduleSoutenanceRequest;
use App\Http\Requests\Internship\ValidateInternshipRequest;
use App\Models\Internship;
use App\Models\Soutenance;
use App\Services\Academic\InternshipService;
use App\Services\Academic\SoutenanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminInternshipController extends Controller
{
    public function __construct(
        private InternshipService $internshipService,
        private SoutenanceService $soutenanceService
    ) {}

    /**
     * Liste tous les stages avec relations.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Internship::class);

        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginated = Internship::with(['student.user', 'soutenance.room'])
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'internships' => $paginated->items(),
            'total' => $paginated->total(),
            'meta' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
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
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $internship = Internship::findOrFail($id);
        $this->authorize('update', $internship);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', array_column(InternshipStatus::cases(), 'value'))],
        ]);

        $internship->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour',
            'data' => $internship->fresh(['student.user']),
        ]);
    }

    public function validateInternship(int $id, ValidateInternshipRequest $request): JsonResponse
    {
        $internship = Internship::findOrFail($id);
        $this->authorize('update', $internship);

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
