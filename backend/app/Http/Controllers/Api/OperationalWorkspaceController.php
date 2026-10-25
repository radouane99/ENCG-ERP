<?php

namespace App\Http\Controllers\Api;

use App\Actions\Document\AssignDocumentFollowupAction;
use App\Http\Controllers\Controller;
use App\Services\Core\OperationalWorkspaceService;
use Illuminate\Http\Request;

class OperationalWorkspaceController extends Controller
{
    public function index(Request $request, OperationalWorkspaceService $workspace)
    {
        return response()->json(['data' => $workspace->snapshot($request->user())]);
    }
    public function assign(Request $request, int $id, AssignDocumentFollowupAction $action)
    {
        $data = $request->validate(['assigned_to' => 'present|nullable|integer', 'due_at' => 'present|nullable|date|after:now', 'revision' => 'required|integer|min:0', 'reason' => 'required|string|min:10|max:1000']);
        $action->execute($request->user(), $id, $data);
        return response()->json(['message' => 'Responsable et échéance enregistrés.']);
    }
}
