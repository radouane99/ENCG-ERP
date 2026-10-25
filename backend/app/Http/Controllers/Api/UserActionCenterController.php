<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Academic\UserActionCenterService;
use Illuminate\Http\Request;

class UserActionCenterController extends Controller
{
    public function student(Request $request, UserActionCenterService $service)
    {
        return response()->json($service->student($request->user()));
    }

    public function professor(Request $request, UserActionCenterService $service)
    {
        $request->validate(['group_id' => 'nullable|integer|min:1']);

        return response()->json($service->professor($request->user(), $request->filled('group_id') ? $request->integer('group_id') : null));
    }
}
