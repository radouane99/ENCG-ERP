<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Services\AbsenceManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentAbsenceController extends Controller
{
    public function __construct(
        private AbsenceManagementService $absenceService
    ) {}

    /**
     * Liste des absences de l'étudiant connecté.
     */
    public function index(): JsonResponse
    {
        $studentId = Auth::user()->student->id;

        $absences = Attendance::with(['attendanceSession.module', 'absenceJustification.media'])
            ->where('student_id', $studentId)
            ->whereIn('status', ['absent', 'late', 'excused'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $absences,
        ]);
    }

    /**
     * Justifier une absence.
     */
    public function justify(Request $request, Attendance $attendance): JsonResponse
    {
        $request->validate([
            'reason'      => 'required|string|max:255',
            'description' => 'nullable|string',
            'document'    => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $student = Auth::user()->student;

        try {
            $justification = $this->absenceService->submitJustification(
                $student,
                $attendance,
                $request->only(['reason', 'description']),
                $request->file('document')
            );

            return response()->json([
                'success' => true,
                'message' => 'Justificatif soumis avec succès.',
                'data'    => $justification->load('media'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}