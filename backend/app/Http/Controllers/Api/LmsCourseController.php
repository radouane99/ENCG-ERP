<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\LearningMaterial;
use App\Models\Module;
use App\Models\ModuleProfessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LmsCourseController extends Controller
{
    /**
     * Liste des modules/cours de l'utilisateur connecté.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $modules = Module::with(['filiere'])
            ->when($user?->student, function ($query) use ($user) {
                $filiereIds = $user->student->registrations()->pluck('filiere_id')->unique()->filter();
                if ($filiereIds->isNotEmpty()) {
                    $query->whereIn('filiere_id', $filiereIds);
                }
            })
            ->when($user?->professor, function ($query) use ($user) {
                $moduleIds = ModuleProfessor::where('professor_id', $user->professor->id)->pluck('module_id');
                if ($moduleIds->isNotEmpty()) {
                    $query->whereIn('id', $moduleIds);
                }
            })
            ->take(10)
            ->get();

        $classes = $modules->map(function ($module) {
            $pubs     = LearningMaterial::where('module_id', $module->id)->where('type', '!=', 'document')->count();
            $supports = LearningMaterial::where('module_id', $module->id)->where('type', 'document')->count();

            return [
                'id'       => $module->id,
                'title'    => $module->name,
                'code'     => $module->code,
                'group'    => $module->filiere->name ?? 'GÉNÉRAL',
                'color'    => 'from-blue-600 to-indigo-600',
                'teacher'  => 'Équipe Pédagogique',
                'pubs'     => $pubs,
                'supports' => $supports,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $classes,
        ]);
    }

    /**
     * Détails d'un module/cours.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $module    = Module::findOrFail($id);
        $materials = LearningMaterial::where('module_id', $module->id)
            ->with(['professor'])
            ->latest()
            ->get();

        return response()->json([
            'success'   => true,
            'module'    => [
                'id'    => $module->id,
                'title' => $module->name,
                'code'  => $module->code,
            ],
            'materials' => $materials,
        ]);
    }

    /**
     * Ajouter un support de cours (professeur uniquement).
     */
    public function storeMaterial(Request $request, int $moduleId): JsonResponse
    {
        $hasPermittedRole = $request->user()->roles->pluck('name')
            ->intersect(['super-admin', 'admin', 'institution-admin', 'professor', 'vacataire'])
            ->isNotEmpty();

        abort_unless($hasPermittedRole, 403);

        $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'type'         => 'required|in:document,video,link,quiz_bank',
            'file'         => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,zip,rar|max:51200',
            'external_url' => 'nullable|url',
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('lms/materials', 'public');
        }

        $academicYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::first();
        if (!$academicYear) {
            return response()->json(['success' => false, 'message' => 'Année académique introuvable.'], 404);
        }

        $material = LearningMaterial::create([
            'module_id'        => $moduleId,
            'academic_year_id' => $academicYear->id,
            'professor_id'     => $request->user()->id,
            'professor_type'   => \App\Models\User::class,
            'title'            => $request->title,
            'description'      => $request->description,
            'type'             => $request->type,
            'file_path'        => $filePath,
            'external_url'     => $request->external_url,
            'is_published'     => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Support ajouté avec succès.',
            'data'    => $material,
        ], 201);
    }
}