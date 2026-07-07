<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\AcademicYear;

class ProfessorAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentYear = AcademicYear::where('is_current', true)->first();
        if (!$currentYear) {
            return response()->json(['data' => []]);
        }

        $assignments = DB::table('module_professor')
            ->join('professors', 'module_professor.professor_id', '=', 'professors.id')
            ->join('users', 'professors.user_id', '=', 'users.id')
            ->join('modules', 'module_professor.module_id', '=', 'modules.id')
            ->join('groups', 'module_professor.group_id', '=', 'groups.id')
            ->where('module_professor.academic_year_id', $currentYear->id)
            ->select(
                'module_professor.id',
                'users.first_name as prof_first_name',
                'users.last_name as prof_last_name',
                'modules.code as module_code',
                'modules.name as module_name',
                'groups.name as group_name'
            )
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'prof' => trim($item->prof_first_name . ' ' . $item->prof_last_name),
                    'module' => $item->module_code . ' ' . $item->module_name,
                    'group' => $item->group_name
                ];
            });

        return response()->json(['data' => $assignments]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_id' => 'required|integer|exists:professors,id',
            'module_id' => 'required|integer|exists:modules,id',
            'group_id' => 'required|integer|exists:groups,id',
        ]);

        $currentYear = AcademicYear::where('is_current', true)->first();
        if (!$currentYear) {
            return response()->json(['message' => 'Aucune année universitaire courante.'], 400);
        }

        // Check if assignment already exists
        $exists = DB::table('module_professor')
            ->where('academic_year_id', $currentYear->id)
            ->where('module_id', $validated['module_id'])
            ->where('group_id', $validated['group_id'])
            ->where('professor_id', $validated['professor_id'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Cette affectation existe déjà.'], 400);
        }

        $id = DB::table('module_professor')->insertGetId([
            'academic_year_id' => $currentYear->id,
            'module_id' => $validated['module_id'],
            'group_id' => $validated['group_id'],
            'professor_id' => $validated['professor_id'],
            'professor_type' => 'App\Models\Professor',
            'session_type' => 'cm', // Defaulting to CM
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Affectation ajoutée.', 'data' => ['id' => $id]]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $deleted = DB::table('module_professor')->where('id', $id)->delete();
        
        if (!$deleted) {
            return response()->json(['message' => 'Affectation non trouvée.'], 404);
        }
        
        return response()->json(['message' => 'Affectation supprimée.']);
    }
}
