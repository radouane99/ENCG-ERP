<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfessorSubstitution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorSubstitutionController extends Controller
{
    /**
     * Liste des suppléances et délégations temporaires.
     */
    public function index(Request $request): JsonResponse
    {
        $substitutions = ProfessorSubstitution::with([
            'originalProfessor.user',
            'substituteProfessor.user',
            'module.filiere',
            'creator',
        ])
            ->latest()
            ->get()
            ->map(function ($sub) {
                $isActive = $sub->status === 'active' && now()->between($sub->start_date, $sub->end_date);

                return [
                    'id' => $sub->id,
                    'original_professor_id' => $sub->original_professor_id,
                    'original_professor_name' => $sub->originalProfessor?->user?->name ?? 'Enseignant Titulaire',
                    'substitute_professor_id' => $sub->substitute_professor_id,
                    'substitute_professor_name' => $sub->substituteProfessor?->user?->name ?? 'Enseignant Remplaçant',
                    'module_id' => $sub->module_id,
                    'module_name' => $sub->module?->name ?? 'Module ENCG',
                    'module_code' => $sub->module?->code ?? "MOD-{$sub->module_id}",
                    'filiere_name' => $sub->module?->filiere?->name ?? 'Filière ENCG',
                    'start_date' => $sub->start_date->format('Y-m-d'),
                    'end_date' => $sub->end_date->format('Y-m-d'),
                    'reason' => $sub->reason ?? 'Remplacement d\'urgence',
                    'status' => $isActive ? 'active' : ($sub->status === 'revoked' ? 'revoked' : 'expired'),
                    'created_by_name' => $sub->creator?->name ?? 'Chef de Département',
                    'created_at' => $sub->created_at->format('Y-m-d H:i'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $substitutions,
        ]);
    }

    /**
     * Accorder une délégation de suppléance temporaire.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'original_professor_id' => 'required|exists:professors,id',
            'substitute_professor_id' => 'required|exists:professors,id|different:original_professor_id',
            'module_id' => 'required|exists:modules,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
        ]);

        $sub = ProfessorSubstitution::create([
            'original_professor_id' => $validated['original_professor_id'],
            'substitute_professor_id' => $validated['substitute_professor_id'],
            'module_id' => $validated['module_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => $validated['reason'] ?? 'Délégation temporaire d\'urgence',
            'status' => 'active',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Suppléance temporaire accordée avec succès.',
            'data' => $sub->load(['originalProfessor.user', 'substituteProfessor.user', 'module']),
        ], 201);
    }

    /**
     * Révquer une suppléance prématurément.
     */
    public function revoke(int $id): JsonResponse
    {
        $sub = ProfessorSubstitution::findOrFail($id);
        $sub->update(['status' => 'revoked']);

        return response()->json([
            'success' => true,
            'message' => 'Délégation de suppléance révoquée avec succès.',
        ]);
    }
}
