<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinalProject;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FinalProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FinalProject::with(['student', 'academicYear']);

        if ($request->search) {
            $s = $request->search;
            $query->where(fn ($q) =>
                $q->where('title', 'like', "%$s%")
                  ->orWhere('company_name', 'like', "%$s%")
                  ->orWhereHas('student', fn($sq) => 
                      $sq->where('first_name', 'like', "%$s%")->orWhere('last_name', 'like', "%$s%")
                  )
            );
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $projects = $query->latest()->get()->map(fn ($p) => [
            'id' => $p->id,
            'title' => $p->title,
            'type' => $p->type,
            'company_name' => $p->company_name,
            'company_city' => $p->company_city,
            'status' => $p->status,
            'student_name' => $p->student ? $p->student->first_name . ' ' . $p->student->last_name : '—',
            'student_id' => $p->student_id,
            'academic_year' => $p->academicYear?->label ?? '—',
        ]);

        return response()->json([
            'data' => $projects,
            'stats' => [
                'total' => $projects->count(),
                'pending' => $projects->where('status', 'submitted')->count(),
                'approved' => $projects->where('status', 'approved')->count(),
                'defended' => $projects->where('status', 'defended')->count(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:pfe,pfa',
            'company_name' => 'nullable|string|max:255',
            'company_city' => 'nullable|string|max:100',
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'status' => 'required|in:draft,submitted,approved,rejected,defended',
        ]);

        $validated['institution_id'] = 1;
        $project = FinalProject::create($validated);

        return response()->json([
            'message' => 'Projet de fin d\'études créé avec succès.',
            'data' => $project
        ], 201);
    }

    public function update(Request $request, FinalProject $finalProject): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:pfe,pfa',
            'company_name' => 'nullable|string|max:255',
            'company_city' => 'nullable|string|max:100',
            'student_id' => 'sometimes|required|exists:students,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'status' => 'sometimes|required|in:draft,submitted,approved,rejected,defended',
        ]);

        $finalProject->update($validated);

        return response()->json([
            'message' => 'Projet mis à jour.',
            'data' => $finalProject
        ]);
    }

    public function destroy(FinalProject $finalProject): JsonResponse
    {
        $finalProject->delete();
        return response()->json(['message' => 'Projet supprimé.']);
    }
}
