<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ModuleResource;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use App\Services\Academic\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    public function __construct(
        private ModuleService $moduleService
    ) {}

    /**
     * Liste des modules avec filtres et RBAC.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Module::with(['filiere']);

        if ($request->filled('filiere_id')) {
            $query->where('filiere_id', (int) $request->filiere_id);
        }

        if ($request->filled('semester')) {
            $query->where('semester_number', (int) $request->semester);
        }

        // 🛡️ RBAC : Les professeurs ne voient que leurs modules
        if ($request->user()?->hasRole(['professor', 'vacataire'])) {
            $prof = Professor::where('user_id', $request->user()->id)->first();
            if ($prof) {
                $moduleIds = ModuleProfessor::where('professor_id', $prof->id)->pluck('module_id');
                $query->whereIn('id', $moduleIds);
            }
        }

        return response()->json([
            'success' => true,
            'data'    => ModuleResource::collection($query->get()),
        ]);
    }

    /**
     * Créer un module.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'            => 'required|string|max:50|unique:modules,code',
            'name'            => 'required|string|max:255',
            'semester_number' => 'required|integer|min:1|max:12',
            'coefficient'     => 'required|numeric|min:0',
            'filiere_id'      => 'nullable|exists:filieres,id',
            'credit_hours'    => 'nullable|numeric|min:0',
            'is_active'       => 'boolean',
        ]);

        $module = $this->moduleService->createModule($validated, 1);

        return response()->json([
            'success' => true,
            'message' => 'Module créé avec succès.',
            'data'    => new ModuleResource($module),
        ], 201);
    }

    /**
     * Afficher un module.
     */
    public function show(Module $module): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new ModuleResource($module->load('filiere')),
        ]);
    }

    /**
     * Mettre à jour un module.
     */
    public function update(Request $request, Module $module): JsonResponse
    {
        $validated = $request->validate([
            'code'            => 'sometimes|required|string|max:50|unique:modules,code,' . $module->id,
            'name'            => 'sometimes|required|string|max:255',
            'semester_number' => 'sometimes|required|integer|min:1|max:12',
            'coefficient'     => 'sometimes|required|numeric|min:0',
            'filiere_id'      => 'nullable|exists:filieres,id',
            'credit_hours'    => 'nullable|numeric|min:0',
            'is_active'       => 'boolean',
        ]);

        $module = $this->moduleService->updateModule($module, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Module mis à jour avec succès.',
            'data'    => new ModuleResource($module),
        ]);
    }

    /**
     * Supprimer un module.
     */
    public function destroy(Module $module): JsonResponse
    {
        $module->delete();

        return response()->json([
            'success' => true,
            'message' => 'Module supprimé avec succès.',
        ]);
    }
}