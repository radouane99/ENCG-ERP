<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GroupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Group::with(['filiere', 'academicYear']);

        if ($request->filiere_id) {
            $query->where('filiere_id', $request->filiere_id);
        }
        if ($request->semester) {
            $query->where('semester_number', $request->semester);
        }

        $groups = $query->get()->map(fn ($g) => [
            'id'              => $g->id,
            'name'            => $g->name,
            'filiere'         => $g->filiere?->code ?? '—',
            'filiere_id'      => $g->filiere_id,
            'filiere_name'    => $g->filiere?->name ?? '—',
            'semester_number' => $g->semester_number,
            'capacity'        => $g->capacity,
            'current_count'   => $g->current_count ?? 0,
            'academic_year'   => $g->academicYear?->label ?? '—',
            'academic_year_id'=> $g->academic_year_id,
        ]);

        return response()->json(['data' => $groups]);
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

        $group = Group::create($validated);
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

        $group->update($validated);
        return response()->json(['message' => 'Groupe mis à jour.', 'data' => $group]);
    }

    public function destroy(Group $group): JsonResponse
    {
        $group->delete();
        return response()->json(['message' => 'Groupe supprimé.']);
    }
}
