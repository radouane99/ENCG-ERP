<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Filiere;
use App\Services\Academic\FiliereService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FiliereController extends Controller
{
    protected FiliereService $filiereService;

    public function __construct(FiliereService $filiereService)
    {
        $this->filiereService = $filiereService;
    }

    public function index(): JsonResponse
    {
        $filieres = $this->filiereService->getAllFilieres();

        return response()->json([
            'data' => \App\Http\Resources\FiliereResource::collection($filieres)
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:filieres,code',
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'duration_years' => 'required|integer|min:1|max:7',
            'is_active' => 'boolean'
        ]);

        $filiere = $this->filiereService->createFiliere($validated, 1);

        return response()->json([
            'message' => 'Filière créée avec succès.',
            'data' => new \App\Http\Resources\FiliereResource($filiere)
        ], 201);
    }

    public function show(Filiere $filiere): JsonResponse
    {
        return response()->json(['data' => $filiere->load('department')]);
    }

    public function update(Request $request, Filiere $filiere): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50|unique:filieres,code,' . $filiere->id,
            'name' => 'sometimes|required|string|max:255',
            'type' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'duration_years' => 'sometimes|required|integer|min:1|max:7',
            'is_active' => 'boolean'
        ]);

        $filiere = $this->filiereService->updateFiliere($filiere, $validated);

        return response()->json([
            'message' => 'Filière mise à jour avec succès.',
            'data' => $filiere
        ]);
    }

    public function destroy(Filiere $filiere): JsonResponse
    {
        $filiere->delete();

        return response()->json([
            'message' => 'Filière supprimée avec succès.'
        ]);
    }
}
