<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Department;
use App\Models\Group;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProfessorAssignmentController extends Controller
{
    /**
     * Liste des affectations.
     */
    public function index(Request $request): JsonResponse
    {
        $currentYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::latest('start_year')->first();

        if (! $currentYear) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $assignments = ModuleProfessor::with(['professor.user', 'professor.department', 'module', 'group'])
            ->where(function ($q) use ($currentYear) {
                $q->where('academic_year_id', $currentYear->id)
                    ->orWhereNull('academic_year_id');
            })
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'professor_id' => $item->professor?->uuid ?? $item->professor_id,
                'prof_id' => $item->professor?->uuid ?? $item->professor_id,
                'prof' => trim(($item->professor->user->first_name ?? '').' '.($item->professor->user->last_name ?? '')),
                'prof_email' => $item->professor->user->email ?? null,
                'module_id' => $item->module_id,
                'module' => ($item->module->code ?? '').' '.($item->module->name ?? ''),
                'module_name' => $item->module->name ?? '',
                'module_code' => $item->module->code ?? '',
                'group_id' => $item->group_id,
                'group' => $item->group->name ?? 'Tous les groupes',
                'department_id' => $item->professor?->department_id,
                'assigned_hours' => $item->assigned_hours ?? 36,
                'session_type' => $item->session_type ?? 'cm',
                'professor' => $item->professor ? [
                    'id' => $item->professor->uuid ?? $item->professor->id,
                    'specialty' => $item->professor->specialty,
                    'grade' => $item->professor->grade,
                    'department' => $item->professor->department?->name,
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
     * Créer une affectation manuelle.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_id' => 'required',
            'module_id' => 'required',
            'group_id' => 'required',
        ]);

        $currentYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::latest('start_year')->first();
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
            'assigned_hours' => 36,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Affectation ajoutée avec succès.',
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
            'message' => 'Affectation supprimée avec succès.',
        ]);
    }

    /**
     * Désaffecter tous les professeurs (réinitialisation complète).
     */
    public function unassignAll(Request $request): JsonResponse
    {
        $currentYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::latest('start_year')->first();

        $query = ModuleProfessor::query();
        if ($currentYear) {
            $query->where(function ($q) use ($currentYear) {
                $q->where('academic_year_id', $currentYear->id)
                    ->orWhereNull('academic_year_id');
            });
        }

        $count = $query->count();
        $query->delete();

        return response()->json([
            'success' => true,
            'message' => "Toutes les affectations ({$count}) ont été réinitialisées avec succès. Le corps professoral est désormais disponible.",
            'deleted_count' => $count,
        ]);
    }

    /**
     * Désaffecter un professeur spécifique.
     */
    public function unassignProfessor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_id' => 'required',
        ]);

        $profId = Professor::where('uuid', $validated['professor_id'])->value('id') ?? $validated['professor_id'];

        $currentYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::latest('start_year')->first();

        $query = ModuleProfessor::where('professor_id', $profId);
        if ($currentYear) {
            $query->where(function ($q) use ($currentYear) {
                $q->where('academic_year_id', $currentYear->id)
                    ->orWhereNull('academic_year_id');
            });
        }

        $count = $query->count();
        $query->delete();

        return response()->json([
            'success' => true,
            'message' => "Toutes les charges de l'enseignant ({$count}) ont été réinitialisées avec succès.",
            'deleted_count' => $count,
        ]);
    }

    /**
     * Relance / Distribution équitable des affectations à zéro pour TOUS les 18 professeurs.
     * Algorithme d'équilibrage par spécialité, département et volume horaire statutaire.
     */
    public function autoDistribute(Request $request): JsonResponse
    {
        $currentYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::latest('start_year')->first();

        if (! $currentYear) {
            return response()->json(['success' => false, 'message' => 'Aucune année universitaire active trouvée.'], 400);
        }

        // 1. Récupérer l'intégralité des 18 enseignants avec leurs départements et spécialités
        $professors = Professor::with(['user', 'department'])
            ->where('is_active', true)
            ->get();

        if ($professors->isEmpty()) {
            $professors = Professor::with(['user', 'department'])->get();
        }

        if ($professors->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Aucun enseignant trouvé dans le corps professoral.'], 400);
        }

        // 2. Récupérer tous les modules et groupes
        $modules = Module::with(['filiere.department'])->get();
        $groups = Group::all();

        if ($modules->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Aucun module académique disponible.'], 400);
        }

        // 3. Réinitialisation complète des affectations de l'année en cours
        DB::transaction(function () use ($currentYear, $professors, $modules, $groups) {
            ModuleProfessor::where('academic_year_id', $currentYear->id)
                ->orWhereNull('academic_year_id')
                ->delete();

            // Structure de suivi des charges par enseignant
            $profLoads = [];
            foreach ($professors as $p) {
                $profLoads[$p->id] = [
                    'model' => $p,
                    'assigned_count' => 0,
                    'total_hours' => 0,
                    'specialty' => mb_strtolower($p->specialty ?? ''),
                    'dept_code' => $p->department?->code ?? '',
                    'dept_id' => $p->department_id,
                ];
            }

            // Dictionnaire des correspondances spécialités & mots-clés
            $domainKeywords = [
                'finance' => ['finance', 'comptabilit', 'contrôle de gestion', 'audit', 'fiscalit', 'trésorerie', 'gfc', 'comptable'],
                'marketing' => ['marketing', 'commerce', 'vente', 'consommateur', 'mcm', 'commercial', 'distribution', 'négociation', 'logistique'],
                'management' => ['management', 'stratégie', 'ressources humaines', 'grh', 'organisation', 'leadership', 'entrepreneuriat', 'soft skills'],
                'economie' => ['économie', 'macroéconomie', 'microéconomie', 'statistique', 'mathématique', 'économétrie', 'analyse', 'conjoncture'],
                'informatique' => ['informatique', 'système d\'information', 'si', 'erp', 'data', 'base de données', 'web', 'programmation', 'analytics'],
                'droit' => ['droit', 'juridique', 'commercial', 'affaires', 'sociétés', 'contrat', 'travail', 'législation', 'acda'],
                'langues' => ['anglais', 'english', 'langue', 'communication', 'français', 'tec', 'expression', 'espagnol'],
            ];

            // Helper de calcul d'affinité
            $getAffinityScore = function ($profData, $modName, $modCode, $modFiliere) use ($domainKeywords) {
                $target = mb_strtolower("{$modName} {$modCode} {$modFiliere}");
                $score = 0;

                // 1. Test direct de spécialité
                $spec = $profData['specialty'];
                if (! empty($spec)) {
                    $specWords = preg_split('/[\s,\/&]+/', $spec);
                    foreach ($specWords as $sw) {
                        $sw = trim($sw);
                        if (mb_strlen($sw) > 3 && Str::contains($target, $sw)) {
                            $score += 60;
                        }
                    }
                }

                // 2. Test par domaine sémantique
                foreach ($domainKeywords as $domain => $keywords) {
                    $domainMatched = false;
                    foreach ($keywords as $kw) {
                        if (Str::contains($target, $kw)) {
                            $domainMatched = true;
                            break;
                        }
                    }

                    if ($domainMatched) {
                        // Si la spécialité du prof correspond au domaine
                        foreach ($keywords as $kw) {
                            if (Str::contains($spec, $kw)) {
                                $score += 40;
                                break;
                            }
                        }
                        // Correspondance de département
                        if ($domain === 'finance' && $profData['dept_code'] === 'SG') $score += 25;
                        if ($domain === 'marketing' && in_array($profData['dept_code'], ['SG', 'EA'])) $score += 25;
                        if ($domain === 'management' && $profData['dept_code'] === 'SG') $score += 25;
                        if ($domain === 'economie' && $profData['dept_code'] === 'EA') $score += 25;
                        if ($domain === 'informatique' && $profData['dept_code'] === 'IG') $score += 35;
                        if ($domain === 'droit' && $profData['dept_code'] === 'DA') $score += 35;
                        if ($domain === 'langues' && $profData['dept_code'] === 'LC') $score += 35;
                    }
                }

                return $score;
            };

            // Construire la liste de toutes les charges à pourvoir (Module x Groupes)
            $chargeSlots = [];
            foreach ($modules as $mod) {
                $modGroups = $groups->where('filiere_id', $mod->filiere_id)->values();
                if ($modGroups->isEmpty()) {
                    $chargeSlots[] = [
                        'module' => $mod,
                        'group' => null,
                        'hours' => 36,
                        'type' => 'cm',
                    ];
                } else {
                    foreach ($modGroups as $grp) {
                        $chargeSlots[] = [
                            'module' => $mod,
                            'group' => $grp,
                            'hours' => 36,
                            'type' => 'cm',
                        ];
                    }
                }
            }

            // Algorithme d'équilibrage parfait (Equal Load Balancing & Specialty Pairing)
            foreach ($chargeSlots as $slot) {
                $mod = $slot['module'];
                $grp = $slot['group'];
                $modName = $mod->name;
                $modCode = $mod->code ?? '';
                $modFiliere = $mod->filiere?->name ?? '';

                // Évaluer tous les professeurs pour cette charge
                $candidates = [];
                foreach ($profLoads as $profId => $pData) {
                    $affinity = $getAffinityScore($pData, $modName, $modCode, $modFiliere);
                    
                    // Pénalité de charge pour assurer un équilibre strict entre tous les 18 professeurs
                    // Plus un prof a d'heures, moins il est prioritaire
                    $workloadPenalty = $pData['assigned_count'] * 35;
                    $finalScore = $affinity - $workloadPenalty;

                    $candidates[] = [
                        'prof_id' => $profId,
                        'final_score' => $finalScore,
                        'assigned_count' => $pData['assigned_count'],
                        'affinity' => $affinity,
                    ];
                }

                // Trier par score décroissant, puis par charge croissante
                usort($candidates, function ($a, $b) {
                    if ($a['final_score'] === $b['final_score']) {
                        return $a['assigned_count'] <=> $b['assigned_count'];
                    }
                    return $b['final_score'] <=> $a['final_score'];
                });

                $chosen = $candidates[0];
                $chosenProfId = $chosen['prof_id'];

                // Créer l'affectation
                ModuleProfessor::create([
                    'academic_year_id' => $currentYear->id,
                    'module_id' => $mod->id,
                    'group_id' => $grp?->id,
                    'professor_id' => $chosenProfId,
                    'professor_type' => 'App\\Models\\Professor',
                    'session_type' => $slot['type'],
                    'assigned_hours' => $slot['hours'],
                ]);

                // Mettre à jour la charge du professeur choisi
                $profLoads[$chosenProfId]['assigned_count'] += 1;
                $profLoads[$chosenProfId]['total_hours'] += $slot['hours'];
            }

            // Deuxième passe de garantie : s'assurer qu'absolument aucun enseignant n'a 0 charge
            // Si un prof a 0 charge, on lui réalloue équitablement une charge d'un prof plus chargé
            $unassignedProfIds = array_keys(array_filter($profLoads, fn($p) => $p['assigned_count'] === 0));
            if (! empty($unassignedProfIds)) {
                foreach ($unassignedProfIds as $emptyProfId) {
                    // Trouver le prof le plus chargé ayant au moins 3 charges
                    $heavyProfId = null;
                    $maxLoad = 0;
                    foreach ($profLoads as $pId => $pData) {
                        if ($pData['assigned_count'] > $maxLoad) {
                            $maxLoad = $pData['assigned_count'];
                            $heavyProfId = $pId;
                        }
                    }

                    if ($heavyProfId && $maxLoad >= 2) {
                        $transferAssignment = ModuleProfessor::where('academic_year_id', $currentYear->id)
                            ->where('professor_id', $heavyProfId)
                            ->first();

                        if ($transferAssignment) {
                            $transferAssignment->update(['professor_id' => $emptyProfId]);
                            $profLoads[$heavyProfId]['assigned_count'] -= 1;
                            $profLoads[$heavyProfId]['total_hours'] -= 36;
                            $profLoads[$emptyProfId]['assigned_count'] += 1;
                            $profLoads[$emptyProfId]['total_hours'] += 36;
                        }
                    }
                }
            }
        });

        // Statistiques globales de répartition
        $allAssignedProfs = ModuleProfessor::where('academic_year_id', $currentYear->id)
            ->distinct('professor_id')
            ->count('professor_id');

        $totalAssignmentsCount = ModuleProfessor::where('academic_year_id', $currentYear->id)->count();

        return response()->json([
            'success' => true,
            'message' => "Répartition équitable réussie : {$allAssignedProfs} professeurs affectés avec succès sur {$totalAssignmentsCount} charges pédagogiques selon leurs spécialités.",
            'data' => [
                'professors_assigned' => $allAssignedProfs,
                'total_professors' => $professors->count(),
                'total_assignments' => $totalAssignmentsCount,
                'academic_year' => $currentYear->label ?? '2026/2027',
            ],
        ]);
    }
}
