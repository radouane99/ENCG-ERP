<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Module;
use App\Services\Academic\DeliberationEngine;
use Illuminate\Http\JsonResponse;

class DeliberationController extends Controller
{
    protected DeliberationEngine $engine;

    public function __construct(DeliberationEngine $engine)
    {
        $this->engine = $engine;
    }

    public function getStudentTranscript(Student $student): JsonResponse
    {
        $modules = Module::with(['assessments', 'filiere'])->get(); // For demo, getting all modules. In real, get student's modules.
        
        $transcript = [];

        foreach ($modules as $module) {
            $result = $this->engine->calculateModuleResult($student, $module);
            
            $transcript[] = [
                'module_id' => $module->id,
                'module_name' => $module->name,
                'coefficient' => $module->coefficient,
                'result' => $result
            ];
        }

        return response()->json([
            'data' => $transcript
        ]);
    }
}
