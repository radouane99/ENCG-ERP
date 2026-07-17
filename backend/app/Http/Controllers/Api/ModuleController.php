<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Services\Academic\ModuleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ModuleController extends Controller
{
    protected ModuleService $moduleService;

    public function __construct(ModuleService $moduleService)
    {
        $this->moduleService = $moduleService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Module::with(['filiere']);

        if ($request->has('filiere_id') && $request->filiere_id != '') {
            $query->where('filiere_id', $request->filiere_id);
        }

        if ($request->has('semester') && $request->semester != '') {
            $query->where('semester_number', $request->semester);
        }

        $modules = $query->get();

        return response()->json([
            'data' => \App\Http\Resources\ModuleResource::collection($modules)
        ]);
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

        $module = $this->moduleService->createModule($validated, 1);

        return response()->json([
            'message' => 'Module créé avec succès.',
            'data' => new \App\Http\Resources\ModuleResource($module)
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

        $module = $this->moduleService->updateModule($module, $validated);

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
