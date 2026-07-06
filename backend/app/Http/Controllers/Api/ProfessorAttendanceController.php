<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use App\Models\Group;
use App\Models\Module;
use App\Services\AbsenceManagementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfessorAttendanceController extends Controller
{
    public function __construct(
        protected AbsenceManagementService $absenceService
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'group_id' => 'required|exists:groups,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'session_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'session_type' => 'required|string|in:cm,td,tp',
            'room' => 'nullable|string',
            'students' => 'required|array',
            'students.*.student_id' => 'required|exists:students,id',
            'students.*.status' => 'required|string|in:present,absent,late',
            'students.*.notes' => 'nullable|string',
        ]);

        $professorId = Auth::user()->professor->id;

        $sessionData = collect($validated)->except('students')->toArray();
        $sessionData['professor_type'] = 'Professor';

        try {
            $session = $this->absenceService->markAttendance($sessionData, $validated['students'], $professorId);

            return response()->json([
                'message' => 'Attendance saved successfully.',
                'data' => $session
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error saving attendance.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
