<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\Group;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Services\Academic\GroupService;
use App\Services\Security\ProfessorAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class GroupController extends Controller
{
    public function __construct(
        private GroupService $groupService,
        private ProfessorAccessService $accessService
    ) {}

    /**
     * Liste des groupes.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Group::with(['filiere', 'academicYear'])->withCount('students');

        if ($request->filled('filiere_id')) {
            $query->where('filiere_id', (int) $request->filiere_id);
        }

        if ($request->filled('semester')) {
            $query->where('semester_number', (int) $request->semester);
        }

        if ($user && $user->professor && ! $user->hasAnyRole(['super-admin', 'institution-admin', 'director'])) {
            $assignedGroupIds = $this->accessService->getAuthorizedGroupIds($user);
            if ($assignedGroupIds->isNotEmpty()) {
                $query->whereIn('id', $assignedGroupIds);
            }
        }

        $groups = $query->get();
        $mapped = $this->groupService->mapGroupCollection($groups);

        return response()->json([
            'success' => true,
            'data' => $mapped,
        ]);
    }

    /**
     * Créer un groupe.
     */
    public function store(Request $request): JsonResponse
    {
        $academicYearId = $request->input('academic_year_id')
            ?? AcademicYear::where('is_current', true)->value('id')
            ?? AcademicYear::first()?->id
            ?? 1;

        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('groups', 'name')->where(fn ($query) => $query->where('academic_year_id', $academicYearId)),
            ],
            'filiere_id' => 'nullable|exists:filieres,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_number' => 'required|integer|min:1|max:12',
            'capacity' => 'required|integer|min:1',
        ], [
            'name.unique' => 'Un groupe portant le nom "'.$request->input('name').'" existe déjà.',
        ]);

        $group = $this->groupService->createGroup($validated);

        return response()->json([
            'success' => true,
            'message' => 'Groupe créé avec succès.',
            'data' => $group,
        ], 201);
    }

    /**
     * Mettre à jour un groupe.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $group = Group::findOrFail($id);
        $academicYearId = $request->input('academic_year_id') ?? $group->academic_year_id;

        $validated = $request->validate([
            'name' => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('groups', 'name')->where(fn ($query) => $query->where('academic_year_id', $academicYearId))->ignore($group->id),
            ],
            'filiere_id' => 'nullable|exists:filieres,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'semester_number' => 'sometimes|required|integer|min:1|max:12',
            'capacity' => 'sometimes|required|integer|min:1',
        ], [
            'name.unique' => 'Un groupe portant le nom "'.$request->input('name').'" existe déjà.',
        ]);

        $group = $this->groupService->updateGroup($group, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Groupe mis à jour.',
            'data' => $group,
        ]);
    }

    /**
     * Supprimer un groupe.
     */
    public function destroy(int $id): JsonResponse
    {
        $group = Group::findOrFail($id);

        DB::transaction(function () use ($group) {
            StudentRegistration::where('group_id', $group->id)->update(['group_id' => null]);
            StudentPathway::where('group_id', $group->id)->update(['group_id' => null]);
            Exam::where('group_id', $group->id)->update(['group_id' => null]);
            Schedule::where('group_id', $group->id)->delete();
            ExamSeating::whereHas('exam', fn ($q) => $q->where('group_id', $group->id))->delete();
            $group->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Groupe supprimé avec succès.',
        ]);
    }

    /**
     * Étudiants d'un groupe.
     */
    public function getGroupStudents(int $id): JsonResponse
    {
        $group = Group::findOrFail($id);

        $studentIds = StudentRegistration::where('group_id', $group->id)->pluck('student_id');
        if ($studentIds->isEmpty()) {
            $studentIds = StudentPathway::where('group_id', $group->id)->pluck('student_id');
        }

        $students = Student::with('user')->whereIn('id', $studentIds)->get();

        $mapped = $students->map(fn ($st) => [
            'id' => $st->id,
            'cne' => $st->cne ?? 'N'.(13800000 + $st->id),
            'first_name' => $st->user->first_name ?? 'Étudiant',
            'last_name' => $st->user->last_name ?? '#'.$st->id,
            'email' => $st->user->email ?? 'student'.$st->id.'@encg.ma',
            'is_delegate' => $group->delegate_student_id == $st->id,
        ]);

        return response()->json([
            'success' => true,
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'delegate_name' => $group->delegate_name,
                'delegate_student_id' => $group->delegate_student_id,
            ],
            'students' => $mapped,
        ]);
    }

    /**
     * Assigner un délégué de classe.
     */
    public function assignDelegate(Request $request, int $id): JsonResponse
    {
        $group = Group::findOrFail($id);

        $group->update([
            'delegate_student_id' => $request->input('student_id'),
            'delegate_name' => $request->input('student_name'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Délégué mis à jour : '.$request->input('student_name'),
            'delegate_name' => $request->input('student_name'),
        ]);
    }

    /**
     * Répartir les étudiants dans les groupes.
     */
    public function dispatchStudentsToGroups(Request $request): JsonResponse
    {
        $filiereId = $request->input('filiere_id');
        if (! $filiereId) {
            return response()->json(['success' => false, 'message' => 'Filière requise.'], 422);
        }

        $groups = Group::where('filiere_id', $filiereId)->get();
        if ($groups->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Aucun groupe trouvé.'], 404);
        }

        $students = Student::where('filiere_id', $filiereId)->limit(50)->get();
        $groupCount = $groups->count();
        $dispatched = 0;

        foreach ($students as $index => $st) {
            $assignedGroup = $groups[$index % $groupCount];

            StudentRegistration::where('student_id', $st->id)->update(['group_id' => $assignedGroup->id]);
            StudentPathway::where('student_id', $st->id)->update(['group_id' => $assignedGroup->id]);

            $dispatched++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$dispatched} étudiants répartis.",
            'dispatched_count' => $dispatched,
        ]);
    }
}
