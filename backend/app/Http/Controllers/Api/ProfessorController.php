<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProfessorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('professors.view'), 403);

        $query = Professor::with('department');

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%$s%")
                  ->orWhere('last_name', 'like', "%$s%")
                  ->orWhere('email', 'like', "%$s%")
                  ->orWhere('employee_number', 'like', "%$s%");
            });
        }

        if ($request->contract_type) {
            $query->where('contract_type', $request->contract_type);
        }

        $professors = $query->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'employee_number' => $p->employee_number,
                'first_name' => $p->first_name,
                'last_name' => $p->last_name,
                'email' => $p->email,
                'phone' => $p->phone,
                'grade' => $p->grade,
                'specialty' => $p->specialty,
                'contract_type' => $p->contract_type,
                'hire_date' => $p->hire_date?->format('Y-m-d'),
                'is_active' => $p->is_active,
                'department' => $p->department?->name ?? 'Non assigné',
                'department_id' => $p->department_id,
            ];
        });

        return response()->json(['data' => $professors]);
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

        // Auto-generate employee number
        $year = date('Y');
        $count = Professor::whereYear('created_at', $year)->count() + 1;
        $validated['employee_number'] = 'PROF-' . $year . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        $validated['institution_id'] = 1;

        $professor = Professor::create($validated);

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

        $professor->update($validated);

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
