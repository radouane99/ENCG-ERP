<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Group;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorAssignmentController extends Controller
{
    /**
     * Liste des affectations.
     */
    public function index(Request $request): JsonResponse
    {
        $currentYear = AcademicYear::where('is_current', true)->first();

        if (! $currentYear) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $assignments = ModuleProfessor::with(['professor.user', 'professor.department', 'module', 'group'])
            ->where('academic_year_id', $currentYear->id)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'professor_id' => $item->professor?->uuid ?? $item->professor_id,
                'prof_id' => $item->professor?->uuid ?? $item->professor_id,
                'prof' => trim(($item->professor->user->first_name ?? '').' '.($item->professor->user->last_name ?? '')),
                'module_id' => $item->module_id,
                'module' => ($item->module->code ?? '').' '.($item->module->name ?? ''),
                'group_id' => $item->group_id,
                'group' => $item->group->name ?? 'N/A',
                'department_id' => $item->professor?->department_id,
                'professor' => $item->professor ? [
                    'id' => $item->professor->uuid ?? $item->professor->id,
                    'user' => $item->professor->user ? [
                        'email' => $item->professor->user->email,
                        'first_name' => $item->professor->user->first_name,
                        'last_name' => $item->professor->user->last_name,
                    ] : null,
                ] : null,
            ]);

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    /**
     * Créer une affectation.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_id' => 'required',
            'module_id' => 'required',
            'group_id' => 'required',
        ]);

        $currentYear = AcademicYear::where('is_current', true)->first();
        if (! $currentYear) {
            return response()->json(['success' => false, 'message' => 'Aucune année universitaire en cours.'], 400);
        }

        $profId = Professor::where('uuid', $validated['professor_id'])->value('id') ?? $validated['professor_id'];
        $modId = Module::where('uuid', $validated['module_id'])->value('id') ?? $validated['module_id'];
        $grpId = Group::where('uuid', $validated['group_id'])->value('id') ?? $validated['group_id'];

        if (! $profId || ! $modId || ! $grpId) {
            return response()->json(['success' => false, 'message' => 'Entités invalides.'], 400);
        }

        $exists = ModuleProfessor::where('academic_year_id', $currentYear->id)
            ->where('module_id', $modId)
            ->where('group_id', $grpId)
            ->where('professor_id', $profId)
            ->exists();

        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Cette affectation existe déjà.'], 400);
        }

        $assignment = ModuleProfessor::create([
            'academic_year_id' => $currentYear->id,
            'module_id' => $modId,
            'group_id' => $grpId,
            'professor_id' => $profId,
            'professor_type' => 'App\\Models\\Professor',
            'session_type' => 'cm',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Affectation ajoutée.',
            'data' => ['id' => $assignment->id],
        ]);
    }

    /**
     * Supprimer une affectation.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $deleted = ModuleProfessor::where('id', $id)->delete();

        if (! $deleted) {
            return response()->json(['success' => false, 'message' => 'Affectation non trouvée.'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Affectation supprimée.',
        ]);
    }
}
