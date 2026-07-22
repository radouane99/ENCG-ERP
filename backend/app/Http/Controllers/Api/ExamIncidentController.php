<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ExamIncident;

class ExamIncidentController extends Controller
{
    /**
     * Display a listing of the incidents, optionally filtered by session or exam.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ExamIncident::with(['exam.module', 'exam.session', 'student.user', 'reporter']);

        if ($request->has('session_id')) {
            $query->whereHas('exam', function ($q) use ($request) {
                $q->where('exam_session_id', $request->session_id);
            });
        }

        if ($request->has('exam_id')) {
            $query->where('exam_id', $request->exam_id);
        }

        $incidents = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $incidents
        ]);
    }

    /**
     * Store a newly created incident in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'student_id' => 'required|exists:students,id',
            'type' => 'required|string|in:retard,fraude,absence_injustifiee,autre',
            'description' => 'nullable|string'
        ]);

        $incident = ExamIncident::create([
            'exam_id' => $validated['exam_id'],
            'student_id' => $validated['student_id'],
            'reported_by' => $request->user()->id ?? null,
            'type' => $validated['type'],
            'description' => $validated['description']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Incident enregistré avec succès.',
            'data' => $incident
        ], 201);
    }
}
