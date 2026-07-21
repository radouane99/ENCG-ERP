<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SmartGradingController extends Controller
{
    /**
     * Process an uploaded exam scan using "AI" (Simulated).
     */
    public function process(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', // max 10MB
        ]);

        // In production, processing must be performed by a dedicated grading service.
        // This endpoint only accepts the file and enqueues a job to process it.
        try {
            $job = \App\Jobs\ProcessExamScan::dispatch($request->file('file'), $request->user()?->id ?? null);
            return response()->json([
                'success' => true,
                'message' => 'Fichier reçu; traitement en file d\'attente',
                'job_id' => $job->getJobId() ?? null
            ], 202);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Erreur lors de l\'enregistrement du job'], 500);
        }
    }

    /**
     * Export the graded result to the database.
     */
    public function export(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|string',
            'score' => 'required|numeric|min:0|max:20',
            'assessment_id' => 'nullable|integer'
        ]);

        // Validate student exists and permission
        $student = \App\Models\Student::where('student_number', $validated['student_id'])->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Étudiant introuvable'], 404);
        }

        // Persist grade record
        $grade = \App\Models\Grade::create([
            'student_id' => $student->id,
            'score' => $validated['score'],
            'assessment_id' => $validated['assessment_id'] ?? null,
            'entered_by' => $request->user()?->id,
        ]);

        return response()->json(['success' => true, 'message' => 'Note enregistrée', 'grade_id' => $grade->id]);
    }
}
