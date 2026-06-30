<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AcademicYearController extends Controller
{
    public function index(): JsonResponse
    {
        abort_unless(request()->user()->can('academic.view'), 403);

        $years = AcademicYear::orderByDesc('start_year')->get()->map(fn ($y) => [
            'id'         => $y->id,
            'label'      => $y->label,
            'start_year' => $y->start_year,
            'end_year'   => $y->end_year,
            'start_date' => $y->start_date?->format('Y-m-d'),
            'end_date'   => $y->end_date?->format('Y-m-d'),
            'is_current' => $y->is_current,
            'is_locked'  => $y->is_locked,
        ]);
        return response()->json(['data' => $years]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('academic.create'), 403);

        $validated = $request->validate([
            'label'      => 'required|string|max:50',
            'start_year' => 'required|integer|min:2000',
            'end_year'   => 'required|integer|gt:start_year',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
            'is_current' => 'boolean',
        ]);

        if (!empty($validated['is_current'])) {
            AcademicYear::where('is_current', true)->update(['is_current' => false]);
        }

        $validated['institution_id'] = 1;
        $year = AcademicYear::create($validated);
        return response()->json(['message' => 'Année académique créée.', 'data' => $year], 201);
    }

    public function update(Request $request, AcademicYear $academicYear): JsonResponse
    {
        abort_unless($request->user()->can('academic.edit'), 403);

        $validated = $request->validate([
            'label'      => 'sometimes|required|string|max:50',
            'start_year' => 'sometimes|required|integer|min:2000',
            'end_year'   => 'sometimes|required|integer',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
            'is_current' => 'boolean',
            'is_locked'  => 'boolean',
        ]);

        if (!empty($validated['is_current'])) {
            AcademicYear::where('id', '!=', $academicYear->id)->update(['is_current' => false]);
        }

        $academicYear->update($validated);
        return response()->json(['message' => 'Année académique mise à jour.', 'data' => $academicYear]);
    }

    public function destroy(AcademicYear $academicYear): JsonResponse
    {
        abort_unless(request()->user()->can('academic.delete'), 403);

        if ($academicYear->is_locked) {
            return response()->json(['message' => 'Impossible de supprimer une année verrouillée.'], 403);
        }
        $academicYear->delete();
        return response()->json(['message' => 'Année académique supprimée.']);
    }
}
