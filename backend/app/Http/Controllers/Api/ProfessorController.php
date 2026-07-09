<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professor;
use App\Services\HR\ProfessorService;
use App\Http\Resources\ProfessorResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProfessorController extends Controller
{
    protected ProfessorService $professorService;

    public function __construct(ProfessorService $professorService)
    {
        $this->professorService = $professorService;
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('professors.view'), 403);

        $professors = $this->professorService->getFilteredProfessors(
            $request->only(['search', 'contract_type'])
        );

        // [Phase 8] Return ProfessorResource collection
        return response()->json([
            'data' => ProfessorResource::collection($professors),
        ]);
    }

    public function store(\App\Http\Requests\Professor\StoreProfessorRequest $request, \App\Actions\Professor\CreateProfessorAction $action): JsonResponse
    {
        try {
            $professor = $action->execute($request->validated());

            return response()->json([
                'message' => 'Professeur créé avec succès.',
                // [Phase 8] Wrap in Resource
                'data'    => new ProfessorResource($professor->load(['department', 'user'])),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du professeur.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Professor $professor): JsonResponse
    {
        abort_unless(request()->user()->can('professors.view'), 403);

        // [Phase 8] Wrap in ProfessorResource — includes department
        return response()->json([
            'data' => new ProfessorResource($professor->load(['department', 'user'])),
        ]);
    }

    public function update(\App\Http\Requests\Professor\UpdateProfessorRequest $request, Professor $professor, \App\Actions\Professor\UpdateProfessorAction $action): JsonResponse
    {
        try {
            $updated = $action->execute($professor, $request->validated());

            return response()->json([
                'message' => 'Professeur mis à jour avec succès.',
                // [Phase 8] Wrap in Resource
                'data'    => new ProfessorResource($updated->load(['department', 'user'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du professeur.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Professor $professor, \App\Actions\Professor\DeleteProfessorAction $action): JsonResponse
    {
        abort_unless(request()->user()->can('professors.delete'), 403);

        try {
            $action->execute($professor);

            return response()->json(['message' => 'Professeur supprimé avec succès.']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du professeur.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
