<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessExamScan;
use App\Models\Grade;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmartGradingController extends Controller
{
    /**
     * Traiter un scan d'examen via IA.
     */
    public function process(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        try {
            ProcessExamScan::dispatch($request->file('file'), $request->user()?->id);

            return response()->json([
                'success' => true,
                'message' => 'Fichier reçu, traitement en file d\'attente.',
            ], 202);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise en file d\'attente.',
            ], 500);
        }
    }

    /**
     * Exporter une note corrigée.
     */
    public function export(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|string',
            'score' => 'required|numeric|min:0|max:20',
            'assessment_id' => 'nullable|integer',
        ]);

        $student = Student::where('student_number', $validated['student_id'])->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Étudiant introuvable.'], 404);
        }

        $grade = Grade::create([
            'student_id' => $student->id,
            'value' => $validated['score'],
            'assessment_id' => $validated['assessment_id'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Note enregistrée.',
            'grade_id' => $grade->id,
        ]);
    }
}
