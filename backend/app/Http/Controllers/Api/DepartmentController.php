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
        return response()->json([
            'success' => true,
            'data'    => Department::all(),
        ]);
    }

    /**
     * Créer un département.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'name_ar'   => 'nullable|string|max:255',
            'code'      => 'required|string|max:50|unique:departments,code',
            'head_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $validated['institution_id'] = 1;

        $department = Department::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Département créé avec succès.',
            'data'    => $department,
        ], 201);
    }

    /**
     * Afficher un département.
     */
    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => Department::findOrFail($id),
        ]);
    }

    /**
     * Mettre à jour un département.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'name_ar'   => 'nullable|string|max:255',
            'code'      => 'required|string|max:50|unique:departments,code,' . $department->id,
            'head_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $department->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Département mis à jour.',
            'data'    => $department,
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