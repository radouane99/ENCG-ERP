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

        // SIMULATION: In a real environment, we would send the file to an AI service (e.g. Gemini/OpenAI Vision)
        // Here we simulate a processing delay of 2 seconds
        sleep(2);

        // Generate some simulated grading data
        $simulatedData = [
            'total_score' => 14.5,
            'max_score' => 20,
            'confidence' => 0.94,
            'student_id' => '2023001',
            'annotations' => [
                [
                    'box' => ['x' => 120, 'y' => 300, 'w' => 500, 'h' => 150],
                    'score' => 3.5,
                    'max_score' => 4,
                    'feedback' => 'Good explanation, but missed one detail.',
                    'type' => 'text_answer'
                ],
                [
                    'box' => ['x' => 120, 'y' => 500, 'w' => 500, 'h' => 100],
                    'score' => 5.0,
                    'max_score' => 5,
                    'feedback' => 'Perfect calculation.',
                    'type' => 'math_equation'
                ],
                [
                    'box' => ['x' => 120, 'y' => 650, 'w' => 500, 'h' => 80],
                    'score' => 6.0,
                    'max_score' => 11,
                    'feedback' => 'Partial answer.',
                    'type' => 'text_answer'
                ]
            ]
        ];

        return response()->json([
            'success' => true,
            'message' => 'Analyse terminée',
            'data' => $simulatedData
        ]);
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

        // Here we would normally save to the `grades` table
        // For the sake of the demo, we just return success
        
        return response()->json([
            'success' => true,
            'message' => 'Note synchronisée avec succès vers Apogée'
        ]);
    }
}
