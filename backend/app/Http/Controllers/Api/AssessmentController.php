<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\JsonResponse;

class AssessmentController extends Controller
{
    /**
     * Get all assessments for a given module.
     */
    public function getForModule(Module $module): JsonResponse
    {
        return response()->json([
            'data' => $module->assessments
        ]);
    }
}
