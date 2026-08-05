<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamSessionController extends Controller
{
    /**
     * Liste des sessions d'examen.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ExamSession::with(['academicYear', 'semester']);

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $sessions = $query->latest()->get()->map(fn($s) => [
            'id'               => $s->id,
            'name'             => $s->name,
            'type'             => $s->type,
            'start_date'       => $s->start_date?->format('Y-m-d'),
            'end_date'         => $s->end_date?->format('Y-m-d'),
            'is_active'        => $s->is_active,
            'is_locked'        => $s->is_locked,
            'academic_year'    => $s->academicYear?->label ?? '—',
            'semester'         => $s->semester?->name ?? '—',
            'academic_year_id' => $s->academic_year_id,
            'semester_id'      => $s->semester_id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $sessions,
            'stats'   => [
                'total'  => $sessions->count(),
                'active' => $sessions->where('is_active', true)->count(),
            ],
        ]);
    }

    /**
     * Créer une session d'examen.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'type'             => 'required|string|max:50',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_id'      => 'nullable|exists:semesters,id',
            'start_date'       => 'nullable|date',
            'end_date'         => 'nullable|date',
            'is_active'        => 'boolean',
        ]);

        $validated['institution_id'] = 1;

        if (!empty($validated['is_active'])) {
            ExamSession::where('is_active', true)->update(['is_active' => false]);
        }

        $session = ExamSession::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Session d\'examen créée avec succès.',
            'data'    => $session,
        ], 201);
    }

    /**
     * Mettre à jour une session d'examen.
     */
    public function update(Request $request, ExamSession $examSession): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'sometimes|required|string|max:255',
            'type'             => 'sometimes|required|string|max:50',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_id'      => 'nullable|exists:semesters,id',
            'start_date'       => 'nullable|date',
            'end_date'         => 'nullable|date',
            'is_active'        => 'boolean',
            'is_locked'        => 'boolean',
        ]);

        if (!empty($validated['is_active'])) {
            ExamSession::where('id', '!=', $examSession->id)->update(['is_active' => false]);
        }

        $examSession->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Session d\'examen mise à jour.',
            'data'    => $examSession,
        ]);
    }

    /**
     * Supprimer une session d'examen.
     */
    public function destroy(ExamSession $examSession): JsonResponse
    {
        if ($examSession->is_locked) {
            return response()->json(['success' => false, 'message' => 'Impossible de supprimer une session verrouillée.'], 403);
        }

        $examSession->delete();

        return response()->json([
            'success' => true,
            'message' => 'Session d\'examen supprimée.',
        ]);
    }
}