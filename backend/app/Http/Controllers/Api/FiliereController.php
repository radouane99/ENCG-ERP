<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Filiere;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FiliereController extends Controller
{
    /**
     * Obtenir la liste de toutes les filières avec leurs départements et coordinateurs (si définis)
     */
    public function index(): JsonResponse
    {
        // Pour l'instant, on récupère le coordinateur via la relation department s'il existe
        $filieres = Filiere::with(['department'])->get()->map(function ($filiere) {
            return [
                'id' => $filiere->id,
                'code' => $filiere->code,
                'name' => $filiere->name,
                'type' => $filiere->type ?? 'Formation Initiale',
                'coordinator' => $filiere->department ? $filiere->department->head_name : 'Non assigné',
                'students' => rand(50, 400), // Simulation du nombre d'étudiants en attendant la Phase 2
                'active' => $filiere->is_active,
                'duration_years' => $filiere->duration_years,
                'department_id' => $filiere->department_id,
            ];
        });

        return response()->json(['data' => $filieres]);
    }

    /**
     * Enregistrer une nouvelle filière
     */
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

        // Default institution ID to 1 (ENCG Fès) si non fourni
        $validated['institution_id'] = 1;

        $filiere = Filiere::create($validated);

        return response()->json([
            'message' => 'Filière créée avec succès.',
            'data' => $filiere
        ], 201);
    }

    /**
     * Afficher les détails d'une filière
     */
    public function show(Filiere $filiere): JsonResponse
    {
        return response()->json(['data' => $filiere->load('department')]);
    }

    /**
     * Mettre à jour une filière
     */
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

        $filiere->update($validated);

        return response()->json([
            'message' => 'Filière mise à jour avec succès.',
            'data' => $filiere
        ]);
    }

    /**
     * Supprimer une filière
     */
    public function destroy(Filiere $filiere): JsonResponse
    {
        $filiere->delete();

        return response()->json([
            'message' => 'Filière supprimée avec succès.'
        ]);
    }
}
