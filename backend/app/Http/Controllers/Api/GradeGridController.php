<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GradeGridController extends Controller
{
    /**
     * Get students and their grades for a specific module and group.
     */
    public function getGrid(Request $request): JsonResponse
    {
        $moduleId = $request->query('module_id', 1);
        $groupId = $request->query('group_id', 1);

        // Simulated dynamic data for the MVP grid
        $students = [
            ['id' => 1, 'first_name' => 'Omar', 'last_name' => 'Tahiri', 'cc' => 14.5, 'exam' => null, 'average' => null, 'status' => 'Saisie en cours'],
            ['id' => 2, 'first_name' => 'Salma', 'last_name' => 'El Fassi', 'cc' => 16.0, 'exam' => 15.0, 'average' => 15.5, 'status' => 'Validée'],
            ['id' => 3, 'first_name' => 'Othmane', 'last_name' => 'Sekkat', 'cc' => 12.0, 'exam' => 10.0, 'average' => 11.0, 'status' => 'Validée'],
            ['id' => 4, 'first_name' => 'Zineb', 'last_name' => 'Alaoui', 'cc' => null, 'exam' => null, 'average' => null, 'status' => 'Non saisie'],
            ['id' => 5, 'first_name' => 'Mohammed', 'last_name' => 'Bennis', 'cc' => 8.0, 'exam' => 9.5, 'average' => 8.75, 'status' => 'Validée'],
        ];

        return response()->json([
            'success' => true,
            'data' => $students,
            'meta' => [
                'module_name' => 'Bases de Données Avancées',
                'group_name' => 'Génie Informatique - Groupe 1',
                'weights' => ['cc' => 0.5, 'exam' => 0.5] // 50% CC, 50% Exam
            ]
        ]);
    }

    /**
     * Save a single grade or batch from the grid (AJAX).
     */
    public function saveGrades(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|integer',
            'group_id' => 'required|integer',
            'updates' => 'required|array',
            'updates.*.student_id' => 'required|integer',
            'updates.*.cc' => 'nullable|numeric|min:0|max:20',
            'updates.*.exam' => 'nullable|numeric|min:0|max:20',
        ]);

        // Logic to calculate average based on weights
        $weightCc = 0.5;
        $weightExam = 0.5;

        $results = [];

        foreach ($validated['updates'] as $update) {
            $average = null;
            $status = 'Non saisie';

            if (isset($update['cc']) && isset($update['exam'])) {
                $average = ($update['cc'] * $weightCc) + ($update['exam'] * $weightExam);
                $status = 'Validée';
            } elseif (isset($update['cc']) || isset($update['exam'])) {
                $status = 'Saisie en cours';
            }

            $results[] = [
                'student_id' => $update['student_id'],
                'average' => $average,
                'status' => $status
            ];
            
            // Here we would normally save to the DB:
            // DB::table('grades')->updateOrInsert(...)
        }

        return response()->json([
            'success' => true,
            'message' => count($validated['updates']) . ' note(s) enregistrée(s) avec succès.',
            'calculated_results' => $results
        ]);
    }
}
