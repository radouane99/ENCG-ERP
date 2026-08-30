<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * Liste des départements.
     */
    public function index(): JsonResponse
    {
        $departments = Department::withCount(['filieres', 'professors'])
            ->with(['filieres:id,department_id,name,code', 'professors.user:id,name,first_name,last_name,email'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $departments,
        ]);
    }

    /**
     * Créer un département.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code',
            'head_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $validated['institution_id'] = 1;

        $department = Department::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Département créé avec succès.',
            'data' => $department->loadCount(['filieres', 'professors']),
        ], 201);
    }

    /**
     * Afficher un département.
     */
    public function show(int $id): JsonResponse
    {
        $department = Department::withCount(['filieres', 'professors'])
            ->with(['filieres', 'professors.user'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $department,
        ]);
    }

    /**
     * Mettre à jour un département.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code,'.$department->id,
            'head_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $department->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Département mis à jour.',
            'data' => $department,
        ]);
    }

    /**
     * Supprimer un département.
     */
    public function destroy(int $id): JsonResponse
    {
        Department::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Département supprimé.',
        ]);
    }
}
