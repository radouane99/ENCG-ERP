<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ModuleController extends Controller
{
    public function index(): JsonResponse
    {
        $modules = Module::with(['filiere'])->get()->map(function ($module) {
            return [
                'id' => $module->id,
                'code' => $module->code,
                'name' => $module->name,
                'semester' => 'S' . $module->semester_number,
                'coefficient' => $module->coefficient,
                'filiere' => $module->filiere ? $module->filiere->code : 'TC',
                'professor' => 'Non assigné', // Placeholder for Phase 3
                'studentsCount' => rand(50, 400),
                'active' => $module->is_active,
                'filiere_id' => $module->filiere_id,
                'semester_number' => $module->semester_number,
                'credit_hours' => $module->credit_hours,
            ];
        });

        return response()->json(['data' => $modules]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:modules,code',
            'name' => 'required|string|max:255',
            'semester_number' => 'required|integer|min:1|max:12',
            'coefficient' => 'required|numeric|min:0',
            'filiere_id' => 'nullable|exists:filieres,id',
            'credit_hours' => 'nullable|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        $validated['institution_id'] = 1; // Default to ENCG Fès

        $module = Module::create($validated);

        return response()->json([
            'message' => 'Module créé avec succès.',
            'data' => $module
        ], 201);
    }

    public function show(Module $module): JsonResponse
    {
        return response()->json(['data' => $module->load('filiere')]);
    }

    public function update(Request $request, Module $module): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50|unique:modules,code,' . $module->id,
            'name' => 'sometimes|required|string|max:255',
            'semester_number' => 'sometimes|required|integer|min:1|max:12',
            'coefficient' => 'sometimes|required|numeric|min:0',
            'filiere_id' => 'nullable|exists:filieres,id',
            'credit_hours' => 'nullable|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        $module->update($validated);

        return response()->json([
            'message' => 'Module mis à jour avec succès.',
            'data' => $module
        ]);
    }

    public function destroy(Module $module): JsonResponse
    {
        $module->delete();

        return response()->json([
            'message' => 'Module supprimé avec succès.'
        ]);
    }
}
