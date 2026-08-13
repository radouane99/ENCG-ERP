<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FiliereResource;
use App\Models\Filiere;
use App\Services\Academic\FiliereService;
use App\Services\Security\ProfessorAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FiliereController extends Controller
{
    public function __construct(
        private FiliereService $filiereService,
        private ProfessorAccessService $accessService
    ) {}

    /**
     * Liste des filières.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->professor && !$user->hasAnyRole(['super-admin', 'institution-admin', 'director'])) {
            $filiereIds = $this->accessService->getAuthorizedFiliereIds($user);
            $filieres = Filiere::whereIn('id', $filiereIds)->get();
        } else {
            $filieres = $this->filiereService->getAllFilieres();
        }

        return response()->json([
            'success' => true,
            'data'    => FiliereResource::collection($filieres),
        ]);
    }

    /**
     * Créer une filière.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'            => 'required|string|max:50|unique:filieres,code',
            'name'            => 'required|string|max:255',
            'type'            => 'nullable|string|max:255',
            'department_id'   => 'nullable|exists:departments,id',
            'responsable_id'  => 'nullable|exists:users,id',
            'duration_years'  => 'required|integer|min:1|max:7',
            'is_active'       => 'boolean',
        ]);

        $filiere = $this->filiereService->createFiliere($validated, 1);

        return response()->json([
            'success' => true,
            'message' => 'Filière créée avec succès.',
            'data'    => new FiliereResource($filiere->load('responsable')),
        ], 201);
    }

    /**
     * Afficher une filière.
     */
    public function show(Filiere $filiere): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new FiliereResource($filiere->load(['department', 'responsable'])),
        ]);
    }

    /**
     * Mettre à jour une filière.
     */
    public function update(Request $request, Filiere $filiere): JsonResponse
    {
        $validated = $request->validate([
            'code'            => 'sometimes|required|string|max:50|unique:filieres,code,' . $filiere->id,
            'name'            => 'sometimes|required|string|max:255',
            'type'            => 'nullable|string|max:255',
            'department_id'   => 'nullable|exists:departments,id',
            'responsable_id'  => 'nullable|exists:users,id',
            'duration_years'  => 'sometimes|required|integer|min:1|max:7',
            'is_active'       => 'boolean',
        ]);

        $filiere = $this->filiereService->updateFiliere($filiere, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Filière mise à jour avec succès.',
            'data'    => new FiliereResource($filiere->load('responsable')),
        ]);
    }

    /**
     * Supprimer une filière.
     */
    public function destroy(Filiere $filiere): JsonResponse
    {
        $filiere->delete();

        return response()->json([
            'success' => true,
            'message' => 'Filière supprimée avec succès.',
        ]);
    }
}