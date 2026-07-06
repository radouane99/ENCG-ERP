<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\Academic\StoreAcademicYearRequest;
use App\Http\Requests\Academic\UpdateAcademicYearRequest;
use App\Http\Requests\Academic\RolloverAcademicYearRequest;

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

    public function store(StoreAcademicYearRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (!empty($validated['is_current'])) {
            AcademicYear::where('is_current', true)->update(['is_current' => false]);
        }

        $validated['institution_id'] = 1;
        $year = AcademicYear::create($validated);
        return response()->json(['message' => 'Année académique créée.', 'data' => $year], 201);
    }

    public function update(UpdateAcademicYearRequest $request, AcademicYear $academicYear): JsonResponse
    {
        $validated = $request->validated();

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

    public function rollover(RolloverAcademicYearRequest $request, $id, \App\Services\Academic\AcademicYearRolloverService $rolloverService): JsonResponse
    {
        $validated = $request->validated();

        $result = $rolloverService->executeRollover(
            $id,
            $validated['new_label'],
            $validated['start_date'],
            $validated['end_date']
        );

        return response()->json($result, $result['success'] ? 200 : 500);
    }
}
