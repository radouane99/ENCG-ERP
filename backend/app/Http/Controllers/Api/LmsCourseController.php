<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\LearningMaterial;
use App\Models\Module;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LmsCourseController extends Controller
{
    /**
     * List modules/classrooms for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $modules = Module::with(['filiere'])
            ->when($user && $user->student, function ($query) use ($user) {
                $filiereIds = $user->student->registrations()->pluck('filiere_id')->unique()->filter();
                if ($filiereIds->isNotEmpty()) {
                    $query->whereIn('filiere_id', $filiereIds);
                }
            })
            ->when($user && $user->professor, function ($query) use ($user) {
                $moduleIds = DB::table('module_professor')
                    ->where('professor_id', $user->professor->id)
                    ->pluck('module_id')
                    ->toArray();

                if (!empty($moduleIds)) {
                    $query->whereIn('id', $moduleIds);
                }
            })
            ->take(10)
            ->get();

        $classes = $modules->map(function ($module) use ($user) {
            // Count pubs and supports
            $pubs = LearningMaterial::where('module_id', $module->id)
                ->where('type', '!=', 'document')
                ->count();
            $supports = LearningMaterial::where('module_id', $module->id)
                ->where('type', 'document')
                ->count();

            return [
                'id' => $module->id,
                'title' => $module->name,
                'code' => $module->code,
                'group' => $module->filiere ? $module->filiere->name : 'GÉNÉRAL',
                'color' => 'from-blue-600 to-indigo-600', // random or default
                'teacher' => 'Équipe Pédagogique', // Default teacher
                'pubs' => $pubs,
                'supports' => $supports,
            ];
        });

        return response()->json([
            'data' => $classes
        ]);
    }

    /**
     * Show details of a specific classroom/module
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $module = Module::findOrFail($id);
        
        $materials = LearningMaterial::where('module_id', $module->id)
            ->with(['professor'])
            ->latest()
            ->get();

        return response()->json([
            'module' => [
                'id' => $module->id,
                'title' => $module->name,
                'code' => $module->code,
            ],
            'materials' => $materials
        ]);
    }

    /**
     * Upload a new learning material (Professor only)
     */
    public function storeMaterial(Request $request, string $moduleId): JsonResponse
    {
        abort_unless($request->user()->hasRole(['super-admin', 'institution-admin', 'professor', 'vacataire']), 403);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:document,video,link,quiz_bank',
            'file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,zip,rar|max:51200', // max 50MB, strict mimes
            'external_url' => 'nullable|url',
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('lms/materials', 'public');
        }

        $academicYear = AcademicYear::where('is_active', true)->first();
        if (!$academicYear) {
            return response()->json(['success' => false, 'message' => 'Année académique active introuvable.'], 404);
        }

        $material = LearningMaterial::create([
            'module_id' => $moduleId,
            'academic_year_id' => $academicYear->id,
            'professor_id' => $request->user()->id,
            'professor_type' => \App\Models\User::class,
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'file_path' => $filePath,
            'external_url' => $request->external_url,
            'is_published' => true,
        ]);

        return response()->json([
            'message' => 'Support ajouté avec succès',
            'data' => $material
        ], 201);
    }
}
