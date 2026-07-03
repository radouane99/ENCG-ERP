<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'data' => \App\Models\Department::all()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code',
            'head_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        // Assumes institution_id = 1 for now (multi-tenant default)
        $validated['institution_id'] = 1;

        $department = \App\Models\Department::create($validated);

        return response()->json([
            'message' => 'Département créé avec succès',
            'data' => $department
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $department = \App\Models\Department::findOrFail($id);
        return response()->json(['data' => $department]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $department = \App\Models\Department::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code,' . $department->id,
            'head_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $department->update($validated);

        return response()->json([
            'message' => 'Département mis à jour avec succès',
            'data' => $department
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $department = \App\Models\Department::findOrFail($id);
        $department->delete();

        return response()->json([
            'message' => 'Département supprimé avec succès'
        ]);
    }
}
