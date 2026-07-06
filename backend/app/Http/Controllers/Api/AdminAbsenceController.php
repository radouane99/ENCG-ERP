<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbsenceJustification;
use App\Services\AbsenceManagementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAbsenceController extends Controller
{
    public function __construct(
        protected AbsenceManagementService $absenceService
    ) {}

    public function index()
    {
        $justifications = AbsenceJustification::with(['student.user', 'attendance.attendanceSession.module', 'media'])
            ->latest()
            ->paginate(15);

        return response()->json($justifications);
    }

    public function updateStatus(Request $request, AbsenceJustification $justification)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|string|nullable',
        ]);

        $adminId = Auth::id(); // User ID of admin

        try {
            $updatedJustification = $this->absenceService->processJustification(
                $justification,
                $validated['status'],
                $adminId,
                $validated['rejection_reason'] ?? null
            );

            return response()->json([
                'message' => 'Justification status updated successfully.',
                'data' => $updatedJustification->load('media')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating status.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
