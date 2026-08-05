<?php

namespace App\Http\Controllers\Api;

use App\Actions\Professor\CreateProfessorAction;
use App\Actions\Professor\DeleteProfessorAction;
use App\Actions\Professor\UpdateProfessorAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Professor\StoreProfessorRequest;
use App\Http\Requests\Professor\UpdateProfessorRequest;
use App\Http\Resources\ProfessorResource;
use App\Models\Professor;
use App\Services\HR\ProfessorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorController extends Controller
{
    public function __construct(
        private ProfessorService $professorService
    ) {}

    /**
     * Liste des professeurs.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('professors.view'), 403);

        $professors = $this->professorService->getFilteredProfessors(
            $request->only(['search', 'contract_type'])
        );

        return response()->json([
            'success' => true,
            'data'    => ProfessorResource::collection($professors),
        ]);
    }

    /**
     * Créer un professeur.
     */
    public function store(StoreProfessorRequest $request, CreateProfessorAction $action): JsonResponse
    {
        try {
            $professor = $action->execute($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Professeur créé avec succès.',
                'data'    => new ProfessorResource($professor->load(['department', 'user'])),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du professeur.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Afficher un professeur.
     */
    public function show(Professor $professor): JsonResponse
    {
        abort_unless(request()->user()->can('professors.view'), 403);

        return response()->json([
            'success' => true,
            'data'    => new ProfessorResource($professor->load(['department', 'user'])),
        ]);
    }

    /**
     * Mettre à jour un professeur.
     */
    public function update(UpdateProfessorRequest $request, Professor $professor, UpdateProfessorAction $action): JsonResponse
    {
        try {
            $updated = $action->execute($professor, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Professeur mis à jour avec succès.',
                'data'    => new ProfessorResource($updated->load(['department', 'user'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du professeur.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un professeur.
     */
    public function destroy(Professor $professor, DeleteProfessorAction $action): JsonResponse
    {
        abort_unless(request()->user()->can('professors.delete'), 403);

        try {
            $action->execute($professor);

            return response()->json([
                'success' => true,
                'message' => 'Professeur supprimé avec succès.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du professeur.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}