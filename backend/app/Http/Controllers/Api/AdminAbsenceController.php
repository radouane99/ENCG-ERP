<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsenceJustification;
use App\Services\AbsenceManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAbsenceController extends Controller
{
    public function __construct(
        private AbsenceManagementService $absenceService
    ) {}

    /**
     * Liste des justificatifs d'absence.
     */
    public function index(): JsonResponse
    {
        $justifications = AbsenceJustification::with([
            'student.user',
            'attendance.attendanceSession.module',
            'media',
        ])
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $justifications,
        ]);
    }

    /**
     * Approuver ou rejeter un justificatif.
     */
    public function updateStatus(Request $request, AbsenceJustification $justification): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|string|nullable',
        ]);

        try {
            $updatedJustification = $this->absenceService->processJustification(
                $justification,
                $validated['status'],
                Auth::id(),
                $validated['rejection_reason'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Justificatif mis à jour avec succès.',
                'data' => $updatedJustification->load('media'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
