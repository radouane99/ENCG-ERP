<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAbsenceController extends Controller
{
    /**
     * Absences de l'étudiant connecté.
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $records = Attendance::with('attendanceSession.module')
            ->where('student_id', $student->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $records,
            'absences' => $records,
        ]);
    }
}
