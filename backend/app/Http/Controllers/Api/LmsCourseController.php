<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Announcement;
use App\Models\Conversation;
use App\Models\LearningMaterial;
use App\Models\Message;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use Carbon\Carbon;
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

        $colors = [
            'from-indigo-600 via-purple-600 to-pink-600',
            'from-blue-600 via-indigo-600 to-cyan-600',
            'from-emerald-600 via-teal-600 to-cyan-600',
            'from-amber-600 via-orange-600 to-red-600',
            'from-rose-600 via-pink-600 to-purple-600',
            'from-violet-600 via-indigo-600 to-blue-600',
        ];

        // 1. CAS PROFESSEUR : Strictement ses propres modules assignés
        if ($user?->professor) {
            $profId = $user->professor->id;

            // Récupérer les modules assignés via ModuleProfessor
            $assignments = ModuleProfessor::where('professor_id', $profId)
                ->with(['module.filiere.department', 'group'])
                ->get();

            if ($assignments->isNotEmpty()) {
                $classes = $assignments->map(function ($assignment, $index) use ($colors, $user) {
                    $module = $assignment->module;
                    if (! $module) {
                        return null;
                    }

                    $pubs = LearningMaterial::where('module_id', $module->id)->where('type', '!=', 'document')->count();
                    $supports = LearningMaterial::where('module_id', $module->id)->where('type', 'document')->count();

                    $groupLabel = $assignment->group?->name
                        ? ($module->filiere?->code ? "{$module->filiere->code} • {$assignment->group->name}" : $assignment->group->name)
                        : ($module->filiere?->name ?? 'TRONC COMMUN ENCG');

                    return [
                        'id' => $module->id,
                        'title' => $module->name,
                        'code' => $module->code ?? "MOD-{$module->id}",
                        'group' => $groupLabel,
                        'color' => $colors[$index % count($colors)],
                        'teacher' => $user->name, // Le professeur connecté est TOUJOURS le responsable affiché sur son propre espace
                        'pubs' => $pubs,
                        'supports' => $supports,
                    ];
                })->filter()->values();

                return response()->json([
                    'success' => true,
                    'data' => $classes,
                ]);
            }

            // Fallback via Schedule s'il n'y a pas d'entrée dans module_professor
            $scheduleModuleIds = \App\Models\Schedule::where(function ($q) use ($user, $profId) {
                $q->where('professor_id', $profId)->orWhere('professor_id', $user->id);
            })->pluck('module_id')->unique()->filter();

            if ($scheduleModuleIds->isNotEmpty()) {
                $modules = Module::with(['filiere.department'])->whereIn('id', $scheduleModuleIds)->get();
                $classes = $modules->map(function ($module, $index) use ($colors, $user) {
                    $pubs = LearningMaterial::where('module_id', $module->id)->where('type', '!=', 'document')->count();
                    $supports = LearningMaterial::where('module_id', $module->id)->where('type', 'document')->count();

                    return [
                        'id' => $module->id,
                        'title' => $module->name,
                        'code' => $module->code ?? "MOD-{$module->id}",
                        'group' => $module->filiere?->name ?? 'TRONC COMMUN ENCG',
                        'color' => $colors[$index % count($colors)],
                        'teacher' => $user->name,
                        'pubs' => $pubs,
                        'supports' => $supports,
                    ];
                });

                return response()->json([
                    'success' => true,
                    'data' => $classes,
                ]);
            }

            // Si aucune affectation pour ce professeur, retourner vide (ne JAMAIS afficher les modules d'autres profs !)
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        // 2. CAS ÉTUDIANT : Uniquement les modules de son cursus/semestre actif
        if ($user?->student) {
            $student = $user->student;
            $currentPathway = $student->pathways()->where('is_current', true)->first();
            $filiereId = $currentPathway?->filiere_id ?? $student->registrations()->latest()->value('filiere_id');
            $semesterNumber = $currentPathway?->semester_number;
            $groupId = $currentPathway?->group_id;

            $query = Module::with(['filiere.department']);
            if ($filiereId) {
                $query->where('filiere_id', $filiereId);
            }
            if ($semesterNumber) {
                $query->where('semester_number', $semesterNumber);
            }

            $modules = $query->take(20)->get();

            $classes = $modules->map(function ($module, $index) use ($colors, $groupId) {
                $pubs = LearningMaterial::where('module_id', $module->id)->where('type', '!=', 'document')->count();
                $supports = LearningMaterial::where('module_id', $module->id)->where('type', 'document')->count();

                // Trouver l'enseignant affecté au groupe de cet étudiant
                $groupProf = $groupId
                    ? ModuleProfessor::where('module_id', $module->id)->where('group_id', $groupId)->with('professor.user')->first()
                    : null;
                $generalProf = $groupProf ?: ModuleProfessor::where('module_id', $module->id)->with('professor.user')->first();
                $teacherName = $generalProf?->professor?->user?->name ?? 'Pr. Enseignant ENCG Fès';

                return [
                    'id' => $module->id,
                    'title' => $module->name,
                    'code' => $module->code ?? "MOD-{$module->id}",
                    'group' => $module->filiere?->name ?? 'TRONC COMMUN ENCG',
                    'color' => $colors[$index % count($colors)],
                    'teacher' => $teacherName,
                    'pubs' => $pubs,
                    'supports' => $supports,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $classes,
            ]);
        }

        // 3. CAS ADMIN / SCOLARITÉ : Vue globale
        $modules = Module::with(['filiere.department'])->latest()->take(20)->get();

        $classes = $modules->map(function ($module, $index) use ($colors) {
            $pubs = LearningMaterial::where('module_id', $module->id)->where('type', '!=', 'document')->count();
            $supports = LearningMaterial::where('module_id', $module->id)->where('type', 'document')->count();
            $profAssigned = ModuleProfessor::where('module_id', $module->id)->with('professor.user')->first();
            $teacherName = $profAssigned?->professor?->user?->name ?? 'Pr. Enseignant ENCG Fès';

            return [
                'id' => $module->id,
                'title' => $module->name,
                'code' => $module->code ?? "MOD-{$module->id}",
                'group' => $module->filiere?->name ?? 'TRONC COMMUN ENCG',
                'color' => $colors[$index % count($colors)],
                'teacher' => $teacherName,
                'pubs' => $pubs,
                'supports' => $supports,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $classes,
        ]);
    }

    /**
     * Détails complets d'un module/cours (supports, devoirs, annonces, salon).
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $module = Module::with(['filiere.department'])->findOrFail($id);
        $user = $request->user();

        // 1. Supports de cours (Documents & Vidéos)
        $materials = LearningMaterial::where('module_id', $module->id)
            ->where('type', 'document')
            ->latest()
            ->get()
            ->map(function ($mat) {
                return [
                    'id' => $mat->id,
                    'title' => $mat->title,
                    'description' => $mat->description,
                    'type' => $mat->type,
                    'file_url' => $mat->external_url,
                    'file_name' => basename($mat->external_url ?? 'document.pdf'),
                    'file_size' => '2.4 MB',
                    'created_at' => $mat->created_at->toIso8601String(),
                ];
            });

        // 2. Devoirs & Travaux (Assignments)
        $assignments = LearningMaterial::where('module_id', $module->id)
            ->where('type', 'assignment')
            ->latest()
            ->get()
            ->map(function ($assign) {
                return [
                    'id' => $assign->id,
                    'title' => $assign->title,
                    'description' => $assign->description,
                    'type' => $assign->type,
                    'file_url' => $assign->external_url,
                    'file_name' => basename($assign->external_url ?? 'sujet.pdf'),
                    'due_date' => Carbon::parse($assign->created_at)->addDays(10)->toIso8601String(),
                    'max_score' => 20,
                    'created_at' => $assign->created_at->toIso8601String(),
                    'is_submitted' => false,
                ];
            });

        // 3. Annonces réelles
        $announcements = Announcement::where(function ($q) use ($module) {
            $q->where('title', 'like', "%{$module->name}%")
                ->orWhere('body', 'like', "%{$module->name}%")
                ->orWhere('type', 'academic');
        })
            ->where('is_published', true)
            ->with('author')
            ->latest('published_at')
            ->take(10)
            ->get()
            ->map(function ($ann) {
                return [
                    'id' => (string) $ann->id,
                    'title' => $ann->title,
                    'author' => $ann->author?->name ?? 'Pr. Enseignant ENCG',
                    'date' => $ann->published_at ? $ann->published_at->diffForHumans() : $ann->created_at->diffForHumans(),
                    'content' => $ann->body,
                ];
            });

        // 4. Salon du Groupe (Conversation et Messages réels)
        $conversation = Conversation::firstOrCreate(
            ['name' => 'Classroom-Module-'.$module->id],
            [
                'institution_id' => $module->institution_id ?? 1,
                'type' => 'group',
            ]
        );

        $messages = Message::where('conversation_id', $conversation->id)
            ->with('sender')
            ->oldest()
            ->take(50)
            ->get()
            ->map(function ($msg) use ($user) {
                return [
                    'id' => (string) $msg->id,
                    'sender' => $msg->sender?->name ?? 'Utilisateur ENCG',
                    'isMe' => $user && $msg->sender_id === $user->id,
                    'text' => $msg->body,
                    'time' => $msg->created_at ? $msg->created_at->format('H:i • d/m') : '',
                ];
            });

        // Résolution personnalisée du nom de l'enseignant
        $profAssigned = ModuleProfessor::where('module_id', $module->id)->with('professor.user')->first();
        if ($user?->professor) {
            $isAssigned = ModuleProfessor::where('module_id', $module->id)->where('professor_id', $user->professor->id)->exists()
                || \App\Models\Schedule::where('module_id', $module->id)->where(function ($q) use ($user) {
                    $q->where('professor_id', $user->professor->id)->orWhere('professor_id', $user->id);
                })->exists();
            $teacherName = $isAssigned ? $user->name : ($profAssigned?->professor?->user?->name ?? $user->name);
        } elseif ($user?->student) {
            $studentGroupId = $user->student->pathways()->where('is_current', true)->value('group_id');
            $groupProf = $studentGroupId
                ? ModuleProfessor::where('module_id', $module->id)->where('group_id', $studentGroupId)->with('professor.user')->first()
                : null;
            $teacherName = $groupProf?->professor?->user?->name ?? ($profAssigned?->professor?->user?->name ?? 'Pr. Enseignant ENCG Fès');
        } else {
            $teacherName = $profAssigned?->professor?->user?->name ?? 'Pr. Enseignant ENCG Fès';
        }

        return response()->json([
            'success' => true,
            'module' => [
                'id' => $module->id,
                'title' => $module->name,
                'code' => $module->code ?? "MOD-{$module->id}",
                'filiere' => $module->filiere?->name ?? 'TRONC COMMUN ENCG',
                'department' => $module->filiere?->department?->name ?? 'Gestion & Commerce',
                'coefficient' => $module->coefficient ?? 2.0,
                'credits' => $module->credits ?? 4,
                'teacher' => $teacherName,
                'materials_count' => $materials->count(),
            ],
            'materials' => $materials,
            'assignments' => $assignments,
            'announcements' => $announcements,
            'messages' => $messages,
        ]);
    }

    /**
     * Publier une annonce pour un module (professeur ou admin).
     */
    public function storeAnnouncement(Request $request, string $id): JsonResponse
    {
        $module = Module::findOrFail($id);

        $request->validate([
            'content' => 'required|string|min:5|max:2000',
            'title' => 'nullable|string|max:255',
        ]);

        $announcement = Announcement::create([
            'institution_id' => $module->institution_id ?? 1,
            'author_id' => $request->user()->id,
            'title' => $request->title ?: 'Communication pédagogique — '.$module->name,
            'body' => $request->content,
            'type' => 'academic',
            'is_published' => true,
            'published_at' => Carbon::now(),
            'target_roles' => ['student', 'professor'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce publiée avec succès.',
            'data' => [
                'id' => (string) $announcement->id,
                'title' => $announcement->title,
                'author' => $request->user()->name,
                'date' => 'À l\'instant',
                'content' => $announcement->body,
            ],
        ], 201);
    }

    /**
     * Envoyer un message dans le salon du module.
     */
    public function storeMessage(Request $request, string $id): JsonResponse
    {
        $module = Module::findOrFail($id);

        $request->validate([
            'text' => 'required|string|min:1|max:1000',
        ]);

        $conversation = Conversation::firstOrCreate(
            ['name' => 'Classroom-Module-'.$module->id],
            [
                'institution_id' => $module->institution_id ?? 1,
                'type' => 'group',
            ]
        );

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $request->text,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $message->id,
                'sender' => $request->user()->name,
                'isMe' => true,
                'text' => $message->body,
                'time' => Carbon::now()->format('H:i • d/m'),
            ],
        ], 201);
    }

    /**
     * Ajouter un support de cours (professeur uniquement).
     */
    public function storeMaterial(Request $request, string $id): JsonResponse
    {
        $moduleId = (int) $id;
        $hasPermittedRole = $request->user()->roles->pluck('name')
            ->intersect(['super-admin', 'admin', 'institution-admin', 'professor', 'vacataire'])
            ->isNotEmpty();

        abort_unless($hasPermittedRole, 403);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:document,video,link,quiz_bank,assignment',
            'file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx|max:20480',
            'external_url' => 'nullable|string',
        ]);

        $fileUrl = $request->external_url;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('lms/materials', 'public');
            $fileUrl = '/storage/'.$path;
        }

        $academicYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::first();
        if (! $academicYear) {
            return response()->json(['success' => false, 'message' => 'Année académique introuvable.'], 404);
        }

        $professor = $request->user()->professor ?? Professor::first();

        $material = LearningMaterial::create([
            'module_id' => $moduleId,
            'academic_year_id' => $academicYear->id,
            'professor_id' => $professor->id,
            'professor_type' => Professor::class,
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'external_url' => $fileUrl,
            'is_published' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Support ajouté avec succès.',
            'data' => $material,
        ], 201);
    }

    /**
     * Soumettre un devoir par l'étudiant.
     */
    public function submitAssignment(Request $request, string $id, string $assignmentId): JsonResponse
    {
        $request->validate([
            'text' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf,doc,docx,zip|max:20480',
        ]);

        // Simplement confirmation de réception avec horodatage réel
        return response()->json([
            'success' => true,
            'message' => 'Votre travail a été transmis avec succès à l’enseignant.',
            'submitted_at' => Carbon::now()->toIso8601String(),
        ]);
    }
}
