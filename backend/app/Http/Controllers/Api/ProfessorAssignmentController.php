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

        $resolveId = function ($modelClass, $idOrUuid) {
            if (empty($idOrUuid)) return null;
            if (is_numeric($idOrUuid)) {
                return (int) $idOrUuid;
            }
            if (is_string($idOrUuid) && Str::isUuid($idOrUuid)) {
                return $modelClass::where('uuid', $idOrUuid)->value('id');
            }
            return $modelClass::where('id', $idOrUuid)->value('id');
        };

        $profId = $resolveId(Professor::class, $validated['professor_id']);
        $modId = $resolveId(Module::class, $validated['module_id']);
        $grpId = $resolveId(Group::class, $validated['group_id']);

        if (! $profId || ! $modId || ! $grpId) {
            return response()->json(['success' => false, 'message' => 'Entités invalides.'], 400);
        }

        $exists = ModuleProfessor::where('module_id', $modId)
            ->where('professor_id', $profId)
            ->exists();

        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Cet enseignant est déjà affecté à ce module.'], 400);
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

        $profId = is_numeric($validated['professor_id'])
            ? (int) $validated['professor_id']
            : (Str::isUuid($validated['professor_id']) ? Professor::where('uuid', $validated['professor_id'])->value('id') : null);

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

            // Suivi des professeurs déjà assignés par module (pour respecter la contrainte UNIQUE module_id, professor_id)
            $assignedProfessorsByModule = [];

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

                // 2. Test par domaine sémantique & département
                foreach ($domainKeywords as $domain => $keywords) {
                    $domainMatched = false;
                    foreach ($keywords as $kw) {
                        if (Str::contains($target, $kw)) {
                            $domainMatched = true;
                            break;
                        }
                    }

                    if ($domainMatched) {
                        foreach ($keywords as $kw) {
                            if (Str::contains($spec, $kw)) {
                                $score += 40;
                                break;
                            }
                        }
                        if ($domain === 'finance' && $profData['dept_code'] === 'SG') $score += 30;
                        if ($domain === 'marketing' && in_array($profData['dept_code'], ['SG', 'EA'])) $score += 30;
                        if ($domain === 'management' && $profData['dept_code'] === 'SG') $score += 30;
                        if ($domain === 'economie' && $profData['dept_code'] === 'EA') $score += 30;
                        if ($domain === 'informatique' && $profData['dept_code'] === 'IG') $score += 40;
                        if ($domain === 'droit' && $profData['dept_code'] === 'DA') $score += 40;
                        if ($domain === 'langues' && $profData['dept_code'] === 'LC') $score += 40;
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

            $totalSlots = count($chargeSlots);
            $totalProfs = count($professors);
            // Plafond strict par enseignant : pour 56 cours / 18 profs = max 4 cours (16h), idéal 3 cours (12h)
            $maxPerProf = (int) ceil($totalSlots / max(1, $totalProfs));
            $targetPerProf = (int) floor($totalSlots / max(1, $totalProfs));

            // PASSE 1 : Affectation par Spécialité et Département avec limite stricte (maxPerProf)
            foreach ($chargeSlots as $slotIndex => $slot) {
                $mod = $slot['module'];
                $grp = $slot['group'];
                $modName = $mod->name;
                $modCode = $mod->code ?? '';
                $modFiliere = $mod->filiere?->name ?? '';

                if (! isset($assignedProfessorsByModule[$mod->id])) {
                    $assignedProfessorsByModule[$mod->id] = [];
                }

                // Filtrer les candidats qui n'ont pas encore atteint le plafond strict et ne sont pas déjà sur ce module
                $candidates = [];
                foreach ($profLoads as $profId => $pData) {
                    if (in_array($profId, $assignedProfessorsByModule[$mod->id])) {
                        continue;
                    }
                    if ($pData['assigned_count'] >= $maxPerProf) {
                        continue;
                    }

                    $affinity = $getAffinityScore($pData, $modName, $modCode, $modFiliere);
                    // Donner une priorité maximale au prof qui a le MOINS de cours actuels
                    $fairnessScore = ($affinity * 2) - ($pData['assigned_count'] * 80);

                    $candidates[] = [
                        'prof_id' => $profId,
                        'affinity' => $affinity,
                        'assigned_count' => $pData['assigned_count'],
                        'fairness_score' => $fairnessScore,
                    ];
                }

                // Fallback si tous les profs disponibles ont atteint maxPerProf
                if (empty($candidates)) {
                    foreach ($profLoads as $profId => $pData) {
                        if (! in_array($profId, $assignedProfessorsByModule[$mod->id])) {
                            $candidates[] = [
                                'prof_id' => $profId,
                                'affinity' => 0,
                                'assigned_count' => $pData['assigned_count'],
                                'fairness_score' => -$pData['assigned_count'],
                            ];
                        }
                    }
                }

                if (empty($candidates)) {
                    continue;
                }

                // Trier : priorité au score équitable, puis au prof le moins chargé
                usort($candidates, function ($a, $b) {
                    if ($a['fairness_score'] === $b['fairness_score']) {
                        return $a['assigned_count'] <=> $b['assigned_count'];
                    }
                    return $b['fairness_score'] <=> $a['fairness_score'];
                });

                $chosen = $candidates[0];
                $chosenProfId = $chosen['prof_id'];

                ModuleProfessor::create([
                    'academic_year_id' => $currentYear->id,
                    'module_id' => $mod->id,
                    'group_id' => $grp?->id,
                    'professor_id' => $chosenProfId,
                    'professor_type' => 'App\\Models\\Professor',
                    'session_type' => $slot['type'],
                    'assigned_hours' => $slot['hours'],
                ]);

                $assignedProfessorsByModule[$mod->id][] = $chosenProfId;
                $profLoads[$chosenProfId]['assigned_count'] += 1;
                $profLoads[$chosenProfId]['total_hours'] += $slot['hours'];
            }

            // PASSE 2 : ÉQUILIBRAGE PARFAIT MIN-MAX (Rebalancing Loop)
            // S'assurer que TOUS les 18 enseignants ont exactement 3 ou 4 cours (écart max <= 1)
            for ($iter = 0; $iter < 30; $iter++) {
                // Trouver le prof avec la charge la plus basse et le prof avec la charge la plus haute
                $minLoad = min(array_column($profLoads, 'assigned_count'));
                $maxLoad = max(array_column($profLoads, 'assigned_count'));

                if (($maxLoad - $minLoad) <= 1) {
                    // Équilibre parfait atteint ! (tous à 3 ou 4 cours)
                    break;
                }

                $underloadedProfId = null;
                $overloadedProfId = null;

                foreach ($profLoads as $pId => $pData) {
                    if ($pData['assigned_count'] === $minLoad && ! $underloadedProfId) {
                        $underloadedProfId = $pId;
                    }
                    if ($pData['assigned_count'] === $maxLoad && ! $overloadedProfId) {
                        $overloadedProfId = $pId;
                    }
                }

                if (! $underloadedProfId || ! $overloadedProfId) {
                    break;
                }

                // Trouver un module transférable du prof surchargé vers le prof sous-chargé
                $transferable = ModuleProfessor::where('academic_year_id', $currentYear->id)
                    ->where('professor_id', $overloadedProfId)
                    ->get()
                    ->first(function ($item) use ($underloadedProfId, $assignedProfessorsByModule) {
                        return ! in_array($underloadedProfId, $assignedProfessorsByModule[$item->module_id] ?? []);
                    });

                if ($transferable) {
                    $modId = $transferable->module_id;
                    $transferable->update(['professor_id' => $underloadedProfId]);

                    $assignedProfessorsByModule[$modId] = array_values(array_diff($assignedProfessorsByModule[$modId] ?? [], [$overloadedProfId]));
                    $assignedProfessorsByModule[$modId][] = $underloadedProfId;

                    $profLoads[$overloadedProfId]['assigned_count'] -= 1;
                    $profLoads[$overloadedProfId]['total_hours'] -= 36;
                    $profLoads[$underloadedProfId]['assigned_count'] += 1;
                    $profLoads[$underloadedProfId]['total_hours'] += 36;
                } else {
                    break;
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
