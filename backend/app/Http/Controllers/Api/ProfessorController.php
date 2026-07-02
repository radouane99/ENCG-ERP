<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professor;
use App\Services\HR\ProfessorService;
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

        $professors = $this->professorService->getFilteredProfessors($request->only(['search', 'contract_type']));
        $mapped = $this->professorService->mapProfessorCollection($professors);

        return response()->json(['data' => $mapped]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('professors.create'), 403);

        $validated = $request->validate([
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'required|email|unique:professors,email',
            'phone'         => 'nullable|string|max:20',
            'grade'         => 'nullable|string|max:100',
            'specialty'     => 'nullable|string|max:255',
            'contract_type' => 'required|in:permanent,contractual,visiting',
            'hire_date'     => 'nullable|date',
            'department_id' => 'nullable|exists:departments,id',
            'is_active'     => 'boolean',
        ]);

        $professor = $this->professorService->createProfessor($validated, 1);

        return response()->json([
            'message' => 'Professeur créé avec succès.',
            'data' => $professor
        ], 201);
    }

    public function show(Request $request, Professor $professor): JsonResponse
    {
        abort_unless($request->user()->can('professors.view'), 403);
        
        return response()->json(['data' => $professor->load('department')]);
    }

    public function update(Request $request, Professor $professor): JsonResponse
    {
        abort_unless($request->user()->can('professors.edit'), 403);

        $validated = $request->validate([
            'first_name'    => 'sometimes|required|string|max:100',
            'last_name'     => 'sometimes|required|string|max:100',
            'email'         => 'sometimes|required|email|unique:professors,email,' . $professor->id,
            'phone'         => 'nullable|string|max:20',
            'grade'         => 'nullable|string|max:100',
            'specialty'     => 'nullable|string|max:255',
            'contract_type' => 'sometimes|required|in:permanent,contractual,visiting',
            'hire_date'     => 'nullable|date',
            'department_id' => 'nullable|exists:departments,id',
            'is_active'     => 'boolean',
        ]);

        $professor = $this->professorService->updateProfessor($professor, $validated);

        return response()->json([
            'message' => 'Professeur mis à jour avec succès.',
            'data' => $professor
        ]);
    }

    public function destroy(Request $request, Professor $professor): JsonResponse
    {
        abort_unless($request->user()->can('professors.delete'), 403);

        $professor->delete();

        return response()->json([
            'message' => 'Professeur supprimé avec succès.'
        ]);
    }
}
