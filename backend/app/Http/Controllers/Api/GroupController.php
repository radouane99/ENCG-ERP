<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Services\Academic\GroupService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GroupController extends Controller
{
    protected GroupService $groupService;

    public function __construct(GroupService $groupService)
    {
        $this->groupService = $groupService;
    }

    public function index(Request $request): JsonResponse
    {
        $groups = $this->groupService->getFilteredGroups($request->only(['filiere_id', 'semester']));
        $mapped = $this->groupService->mapGroupCollection($groups);

        return response()->json(['data' => $mapped]);
    }

    public function store(Request $request): JsonResponse
    {
        $academicYearId = $request->input('academic_year_id')
            ?? \App\Models\AcademicYear::where('is_current', true)->value('id')
            ?? \App\Models\AcademicYear::first()?->id
            ?? 1;

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                \Illuminate\Validation\Rule::unique('groups', 'name')->where(function ($query) use ($academicYearId) {
                    return $query->where('academic_year_id', $academicYearId);
                }),
            ],
            'filiere_id'       => 'nullable|exists:filieres,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_number'  => 'required|integer|min:1|max:12',
            'capacity'         => 'required|integer|min:1',
        ], [
            'name.unique' => 'Un groupe portant le nom "' . $request->input('name') . '" existe déjà pour cette année académique.',
        ]);

        $group = $this->groupService->createGroup($validated);
        
        return response()->json(['message' => 'Groupe créé avec succès.', 'data' => $group], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $group = Group::find($id);
        if (!$group) {
            return response()->json(['message' => 'Groupe introuvable.'], 404);
        }

        $academicYearId = $request->input('academic_year_id') ?? $group->academic_year_id;

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                \Illuminate\Validation\Rule::unique('groups', 'name')->where(function ($query) use ($academicYearId) {
                    return $query->where('academic_year_id', $academicYearId);
                })->ignore($group->id),
            ],
            'filiere_id'       => 'nullable|exists:filieres,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_number'  => 'sometimes|required|integer|min:1|max:12',
            'capacity'         => 'sometimes|required|integer|min:1',
        ], [
            'name.unique' => 'Un groupe portant le nom "' . $request->input('name') . '" existe déjà pour cette année académique.',
        ]);

        $group = $this->groupService->updateGroup($group, $validated);
        
        return response()->json(['message' => 'Groupe mis à jour.', 'data' => $group]);
    }

    public function destroy(int $id): JsonResponse
    {
        $group = Group::find($id);
        if (!$group) {
            return response()->json(['success' => true, 'message' => 'Groupe déjà supprimé.']);
        }

        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($group) {
                $tablesWithGroupId = [
                    'student_registrations',
                    'students',
                    'exam_seatings',
                    'exams',
                    'schedules',
                    'attendance_sessions',
                    'module_pv_signatures',
                    'module_professor',
                    'vacations',
                    'forum_posts',
                    'convocations',
                    'grade_appeals',
                    'deliberation_verdicts',
                    'deliberations',
                ];

                foreach ($tablesWithGroupId as $table) {
                    if (\Illuminate\Support\Facades\Schema::hasTable($table) && \Illuminate\Support\Facades\Schema::hasColumn($table, 'group_id')) {
                        try {
                            \Illuminate\Support\Facades\DB::table($table)->where('group_id', $group->id)->delete();
                        } catch (\Throwable $t) {
                            try {
                                \Illuminate\Support\Facades\DB::table($table)->where('group_id', $group->id)->update(['group_id' => null]);
                            } catch (\Throwable $t2) {
                                // continue
                            }
                        }
                    }
                }

                $group->delete();
            });

            return response()->json(['success' => true, 'message' => 'Groupe supprimé avec succès.']);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Erreur lors de la suppression du groupe: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer ce groupe: ' . $e->getMessage()
            ], 500);
        }
    }
}
