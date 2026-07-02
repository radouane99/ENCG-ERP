<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Services\Academic\GroupService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GroupController extends Controller
{
    protected GroupService $groupService;

    public function __construct(GroupService $groupService)
    {
        $this->groupService = $groupService;
    }

    public function index(Request $request): JsonResponse
    {
        $groups = $this->groupService->getFilteredGroups($request->only(['filiere_id', 'semester']));
        $mapped = $this->groupService->mapGroupCollection($groups);

        return response()->json(['data' => $mapped]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:100',
            'filiere_id'       => 'nullable|exists:filieres,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_number'  => 'required|integer|min:1|max:12',
            'capacity'         => 'required|integer|min:1',
        ]);

        $group = $this->groupService->createGroup($validated);
        
        return response()->json(['message' => 'Groupe créé avec succès.', 'data' => $group], 201);
    }

    public function update(Request $request, Group $group): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'sometimes|required|string|max:100',
            'filiere_id'       => 'nullable|exists:filieres,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_number'  => 'sometimes|required|integer|min:1|max:12',
            'capacity'         => 'sometimes|required|integer|min:1',
        ]);

        $group = $this->groupService->updateGroup($group, $validated);
        
        return response()->json(['message' => 'Groupe mis à jour.', 'data' => $group]);
    }

    public function destroy(Group $group): JsonResponse
    {
        $group->delete();
        
        return response()->json(['message' => 'Groupe supprimé.']);
    }
}
