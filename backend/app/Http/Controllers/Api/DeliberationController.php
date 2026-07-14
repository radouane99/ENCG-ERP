<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Module;
use App\Services\Academic\DeliberationEngine;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DeliberationController extends Controller
{
    protected DeliberationEngine $engine;

    public function __construct(DeliberationEngine $engine)
    {
        $this->engine = $engine;
    }

    /**
     * Exécute le calcul de la moyenne pour un semestre et une session donnés.
     */
    public function run(Request $request): JsonResponse
    {
        $semesterId = $request->query('semester', 1);
        $sessionType = $request->query('session', 'normale');

        $modules = Module::where('semester_id', $semesterId)->with('assessments')->get();
        
        $results = [
            'total_students' => 0,
            'admitted' => 0,
            'rattrapage' => 0,
            'ajourne' => 0,
        ];

        // Fetch students enrolled in this semester
        $students = Student::has('registrations')->get();

        foreach ($students as $student) {
            $results['total_students']++;
            $totalWeights = 0;
            $totalWeightedScore = 0;
            $needsRattrapage = false;
            $isAjourne = false;

            foreach ($modules as $module) {
                $moduleResult = $this->engine->calculateModuleResult($student, $module);
                
                if ($moduleResult['status'] === 'NV') {
                    $isAjourne = true;
                } elseif ($moduleResult['status'] === 'RAT') {
                    $needsRattrapage = true;
                }

                $weight = $module->coefficient ?? 1.0;
                $totalWeightedScore += ($moduleResult['average'] * $weight);
                $totalWeights += $weight;
            }

            $semesterAverage = $totalWeights > 0 ? ($totalWeightedScore / $totalWeights) : 0;

            if ($isAjourne) {
                // Eliminatory mark -> ajourne or rattrapage
                if ($sessionType === 'normale') {
                    $results['rattrapage']++;
                } else {
                    $results['ajourne']++;
                }
            } elseif ($semesterAverage < 10.0 || $needsRattrapage) {
                if ($sessionType === 'normale') {
                    $results['rattrapage']++;
                } else {
                    $results['ajourne']++;
                }
            } else {
                $results['admitted']++;
            }
        }

        return response()->json([
            'message' => 'Délibération calculée avec succès.',
            'data' => [
                'stats' => $results,
                'semester_id' => $semesterId,
                'session' => $sessionType
            ]
        ]);
    }
}
