<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Services\AbsenceManagementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentAbsenceController extends Controller
{
    public function __construct(
        protected AbsenceManagementService $absenceService
    ) {}

    public function index()
    {
        $studentId = Auth::user()->student->id;

        // Get all absences for this student
        $absences = Attendance::with(['attendanceSession.module', 'absenceJustification.media'])
            ->where('student_id', $studentId)
            ->whereIn('status', ['absent', 'late', 'excused'])
            ->latest()
            ->get();

        return response()->json(['data' => $absences]);
    }

    public function justify(Request $request, Attendance $attendance)
    {
        $request->validate([
            'reason' => 'required|string|max:255',
            'description' => 'nullable|string',
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120', // 5MB
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
                'message' => 'Justification submitted successfully.',
                'data' => $justification->load('media')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
