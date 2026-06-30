<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Grade;
use App\Models\AbsenceJustification;
use App\Models\Schedule;

class StudentPortalController extends Controller
{
    /**
     * Get validated and published grades for the student
     */
    public function getGrades(Request $request): JsonResponse
    {
        // Mocking student ID for demo, normally $request->user()->id
        $studentId = $request->input('student_id', 1);

        $grades = Grade::with(['gradeComponent.module', 'examSession'])
            ->where('student_id', $studentId)
            ->whereHas('examSession', function ($q) {
                // APOGEE Rule: Students only see grades when explicitly published/unlocked
                $q->where('is_locked', true);
            })
            ->get();

        return response()->json(['success' => true, 'data' => $grades]);
    }

    /**
     * Submit a medical certificate for an absence
     */
    public function submitAbsence(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|integer',
            'attendance_id' => 'required|integer',
            'reason' => 'required|string',
            'description' => 'nullable|string',
            // 'document' => 'required|file|mimes:pdf,jpg,png'
        ]);

        // Simulating file upload path for demo
        $path = 'justifications/simulated_cert_' . time() . '.pdf';

        $justification = AbsenceJustification::create([
            'student_id' => $validated['student_id'],
            'attendance_id' => $validated['attendance_id'],
            'reason' => $validated['reason'],
            'description' => $validated['description'],
            'document_path' => $path,
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Justificatif soumis avec succès. En attente de validation.',
            'data' => $justification
        ]);
    }

    /**
     * Get student schedule
     */
    public function getSchedule(Request $request): JsonResponse
    {
        $studentId = $request->input('student_id', 1);

        // Demo fallback schedule
        $schedule = [
            ['day' => 'Lundi', 'time' => '08:30 - 10:30', 'module' => 'Comptabilité Générale II', 'room' => 'Amphi A', 'type' => 'CM'],
            ['day' => 'Mardi', 'time' => '10:45 - 12:45', 'module' => 'Algèbre Linéaire', 'room' => 'Salle 302', 'type' => 'TD'],
        ];

        return response()->json(['success' => true, 'data' => $schedule]);
    }
}
