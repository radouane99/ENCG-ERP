<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExamSessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ExamSession::with(['academicYear', 'semester']);

        if ($request->search) {
            $s = $request->search;
            $query->where('name', 'like', "%$s%");
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        $sessions = $query->latest()->get()->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'type' => $s->type,
            'start_date' => $s->start_date?->format('Y-m-d'),
            'end_date' => $s->end_date?->format('Y-m-d'),
            'is_active' => $s->is_active,
            'is_locked' => $s->is_locked,
            'academic_year' => $s->academicYear?->label ?? '—',
            'semester' => $s->semester?->name ?? '—',
            'academic_year_id' => $s->academic_year_id,
            'semester_id' => $s->semester_id,
        ]);

        return response()->json([
            'data' => $sessions,
            'stats' => [
                'total' => $sessions->count(),
                'active' => $sessions->where('is_active', true)->count(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:normal,rattrapage,derogation',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $validated['institution_id'] = 1;

        if (!empty($validated['is_active'])) {
            ExamSession::where('is_active', true)->update(['is_active' => false]);
        }

        $session = ExamSession::create($validated);

        return response()->json([
            'message' => 'Session d\'examen créée avec succès.',
            'data' => $session
        ], 201);
    }

    public function update(Request $request, ExamSession $examSession): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:normal,rattrapage,derogation',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'is_active' => 'boolean',
            'is_locked' => 'boolean',
        ]);

        if (!empty($validated['is_active'])) {
            ExamSession::where('id', '!=', $examSession->id)->update(['is_active' => false]);
        }

        $examSession->update($validated);

        return response()->json([
            'message' => 'Session d\'examen mise à jour.',
            'data' => $examSession
        ]);
    }

    public function destroy(ExamSession $examSession): JsonResponse
    {
        if ($examSession->is_locked) {
            return response()->json(['message' => 'Impossible de supprimer une session verrouillée.'], 403);
        }
        $examSession->delete();
        return response()->json(['message' => 'Session d\'examen supprimée avec succès.']);
    }
}
