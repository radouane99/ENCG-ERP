<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Academic\GradeGridService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeGridController extends Controller
{
    public function getGrid(Request $request, GradeGridService $service): JsonResponse
    {
        $d = $request->validate(['module_id' => 'required|integer', 'group_id' => 'required|integer']);

        return response()->json($service->grid($request->user(), $d['module_id'], $d['group_id']));
    }

    public function saveGrades(Request $request, GradeGridService $service): JsonResponse
    {
        $d = $request->validate(['module_id' => 'required|integer', 'group_id' => 'required|integer', 'updates' => 'required|array|min:1|max:500',
            'updates.*.student_id' => 'required|integer|distinct', 'updates.*.cc' => 'nullable|numeric|between:0,20', 'updates.*.exam' => 'nullable|numeric|between:0,20',
            'updates.*.cc_absent' => 'sometimes|boolean', 'updates.*.exam_absent' => 'sometimes|boolean',
            'updates.*.cc_version' => 'required|integer|min:0', 'updates.*.exam_version' => 'required|integer|min:0']);

        return response()->json($service->save($request->user(), $d));
    }
}
