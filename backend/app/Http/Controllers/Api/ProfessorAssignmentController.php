<?php

namespace App\Http\Controllers\Api;

use App\Actions\Academic\CarryForwardProfessorAssignmentsAction;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Group;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use App\Services\Academic\AcademicContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProfessorAssignmentController extends Controller
{
    public function carryForward(Request $request): JsonResponse
    {
        $validated = $request->validate(['source_year_id' => 'required|integer', 'apply' => 'sometimes|boolean']);

        return response()->json(['success' => true, 'data' => app(CarryForwardProfessorAssignmentsAction::class)->execute($validated['source_year_id'], $validated['apply'] ?? false)]);
    }

    /**
     * Liste des affectations.
     */
    public function index(Request $request): JsonResponse
    {
        $currentYear = AcademicYear::where('institution_id', $request->user()->institution_id)->find(AcademicContext::yearId());

        if (! $currentYear) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $query = ModuleProfessor::with(['professor.user', 'professor.department', 'module', 'group'])
            ->where('academic_year_id', $currentYear->id)
            ->whereHas('module', fn ($q) => $q->where('institution_id', $request->user()->institution_id))
            ->whereHas('professor', fn ($q) => $q->where('institution_id', $request->user()->institution_id));
        // Filtrage optionnel par période semestrielle
        if ($request->filled('semester_period') && $request->semester_period !== 'all') {
            $period = $request->semester_period;
            if ($period === 'odd' || $period === 'autumn' || $period === 's1') {
                $query->whereHas('module', fn ($q) => $q->whereIn('semester_number', [1, 3, 5, 7, 9]));
            } elseif ($period === 'even' || $period === 'spring' || $period === 's2') {
                $query->whereHas('module', fn ($q) => $q->whereIn('semester_number', [2, 4, 6, 8, 10]));
            } elseif (is_numeric($period)) {
                $query->whereHas('module', fn ($q) => $q->where('semester_number', (int) $period));
            }
        }

        $assignments = $query->get()
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
                'semester_number' => $item->module->semester_number ?? null,
                'semester_label' => $item->module->semester_number ? ('S'.$item->module->semester_number) : null,
                'semester_period' => ($item->module && $item->module->semester_number % 2 === 1) ? 'odd' : 'even',
                'group_id' => $item->group_id,
                'group' => $item->group->name ?? 'Tous les groupes',
                'department_id' => $item->professor?->department_id,
                'assigned_hours' => $item->assigned_hours,
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
        return DB::transaction(function () use ($request) {
            $validated = $request->validate([
                'professor_id' => 'required',
                'module_id' => 'nullable',
                'module_ids' => 'nullable|array',
                'group_id' => 'nullable',
                'group_ids' => 'nullable|array',
                'session_type' => 'nullable|in:cm,td,tp,both',
                'assigned_hours' => 'nullable|integer|min:1|max:1000',
            ]);

            $currentYear = AcademicYear::where('institution_id', $request->user()->institution_id)->find(AcademicContext::yearId());
            if (! $currentYear) {
                return response()->json(['success' => false, 'message' => 'Aucune année universitaire en cours.'], 400);
            }

            $resolveId = function ($modelClass, $idOrUuid) {
                if (empty($idOrUuid)) {
                    return null;
                }
                if (is_numeric($idOrUuid)) {
                    return (int) $idOrUuid;
                }
                if (is_string($idOrUuid) && Str::isUuid($idOrUuid)) {
                    return $modelClass::where('uuid', $idOrUuid)->value('id');
                }

                return $modelClass::where('id', $idOrUuid)->value('id');
            };

            $profId = $resolveId(Professor::class, $validated['professor_id']);
            if (! $profId) {
                return response()->json(['success' => false, 'message' => 'Enseignant invalide.'], 400);
            }

            // Collecter les modules (soit array module_ids soit single module_id)
            $rawModuleIds = ! empty($validated['module_ids']) ? $validated['module_ids'] : (array) ($validated['module_id'] ?? []);
            $resolvedModuleIds = [];
            foreach ($rawModuleIds as $mId) {
                $r = $resolveId(Module::class, $mId);
                if ($r) {
                    $resolvedModuleIds[] = $r;
                }
            }
            $resolvedModuleIds = array_unique($resolvedModuleIds);

            // Collecter les groupes (soit array group_ids soit single group_id)
            $rawGroupIds = ! empty($validated['group_ids']) ? $validated['group_ids'] : (array) ($validated['group_id'] ?? []);
            $resolvedGroupIds = [];
            foreach ($rawGroupIds as $gId) {
                if ($gId === 'all') {
                    continue;
                }
                $r = $resolveId(Group::class, $gId);
                if ($r) {
                    $resolvedGroupIds[] = $r;
                }
            }
            $resolvedGroupIds = array_unique($resolvedGroupIds);

            if (empty($resolvedModuleIds)) {
                return response()->json(['success' => false, 'message' => 'Veuillez sélectionner au moins un module.'], 400);
            }

            if (empty($resolvedGroupIds)) {
                return response()->json(['success' => false, 'message' => 'Veuillez sélectionner au moins un groupe ou section.'], 400);
            }

            $sessionTypeInput = strtolower($validated['session_type'] ?? 'cm');
            $typesToCreate = ($sessionTypeInput === 'both') ? ['cm', 'td'] : [$sessionTypeInput];

            $createdCount = 0;
            abort_if($currentYear->is_locked, 409, 'Année universitaire verrouillée.');
            Professor::where('institution_id', $request->user()->institution_id)->where('is_active', true)->findOrFail($profId);
            foreach ($resolvedModuleIds as $modId) {
                $module = Module::where('institution_id', $request->user()->institution_id)->findOrFail($modId);
                foreach ($resolvedGroupIds as $grpId) {
                    Group::where('filiere_id', $module->filiere_id)->where('semester_number', $module->semester_number)->where('academic_year_id', $currentYear->id)->findOrFail($grpId);
                    foreach ($typesToCreate as $sType) {
                        $exists = ModuleProfessor::where('module_id', $modId)
                            ->where('professor_id', $profId)
                            ->where('group_id', $grpId)
                            ->where('session_type', $sType)
                            ->where('academic_year_id', $currentYear->id)
                            ->exists();

                        if (! $exists) {
                            $hours = (int) ($validated['assigned_hours'] ?? ($sType === 'cm' ? 36 : 18));
                            ModuleProfessor::create([
                                'academic_year_id' => $currentYear->id,
                                'module_id' => $modId,
                                'group_id' => $grpId,
                                'professor_id' => $profId,
                                'professor_type' => 'App\\Models\\Professor',
                                'session_type' => $sType,
                                'assigned_hours' => $hours,
                            ]);
                            $createdCount++;
                        }
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => $createdCount > 1
                    ? "{$createdCount} affectations enregistrées avec succès !"
                    : ($createdCount === 1 ? 'Affectation ajoutée avec succès.' : 'Les affectations sélectionnées existent déjà.'),
                'data' => ['created_count' => $createdCount],
            ]);
        });
    }

    /**
     * Supprimer une affectation.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $year = AcademicYear::where('institution_id', $request->user()->institution_id)->findOrFail(AcademicContext::yearId());
        abort_if($year->is_locked, 409, 'Année verrouillée.');
        $deleted = ModuleProfessor::where('id', $id)->where('academic_year_id', $year->id)->whereHas('module', fn ($q) => $q->where('institution_id', $request->user()->institution_id))->delete();

        if (! $deleted) {
            return response()->json(['success' => false, 'message' => 'Affectation non trouvée.'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Affectation supprimée avec succès.',
        ]);
    }

    /**
     * Désaffecter tous les professeurs (réinitialisation complète ou par semestre).
     */
    public function unassignAll(Request $request): JsonResponse
    {
        $currentYear = AcademicYear::where('institution_id', $request->user()->institution_id)->find(AcademicContext::yearId());
        $semesterPeriod = $request->input('semester_period', 'all');

        abort_unless($currentYear, 422, 'Année requise.');
        abort_if($currentYear->is_locked, 409, 'Année verrouillée.');
        $query = ModuleProfessor::where('academic_year_id', $currentYear->id)->whereHas('module', fn ($q) => $q->where('institution_id', $request->user()->institution_id));
        if ($currentYear) {
            $query->where(function ($q) use ($currentYear) {
                $q->where('academic_year_id', $currentYear->id)
                    ->orWhereNull('academic_year_id');
            });
        }

        if ($semesterPeriod === 'odd' || $semesterPeriod === 'autumn' || $semesterPeriod === 's1') {
            $query->whereHas('module', fn ($q) => $q->whereIn('semester_number', [1, 3, 5, 7, 9]));
        } elseif ($semesterPeriod === 'even' || $semesterPeriod === 'spring' || $semesterPeriod === 's2') {
            $query->whereHas('module', fn ($q) => $q->whereIn('semester_number', [2, 4, 6, 8, 10]));
        } elseif (is_numeric($semesterPeriod)) {
            $query->whereHas('module', fn ($q) => $q->where('semester_number', (int) $semesterPeriod));
        }

        $count = $query->count();
        $query->delete();

        $periodLabel = match ($semesterPeriod) {
            'odd', 'autumn', 's1' => 'du Semestre 1 / Automne (S1, S3, S5, S7, S9)',
            'even', 'spring', 's2' => 'du Semestre 2 / Printemps (S2, S4, S6, S8, S10)',
            'all' => "de l'année universitaire",
            default => is_numeric($semesterPeriod) ? "du Semestre S{$semesterPeriod}" : 'de la session'
        };

        return response()->json([
            'success' => true,
            'message' => "Toutes les affectations {$periodLabel} ({$count}) ont été réinitialisées avec succès. Le corps professoral est disponible.",
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

        $currentYear = AcademicYear::where('institution_id', $request->user()->institution_id)->find(AcademicContext::yearId());

        Professor::where('institution_id', $request->user()->institution_id)->findOrFail($profId);
        abort_unless($currentYear, 422, 'Année requise.');
        abort_if($currentYear->is_locked, 409, 'Année verrouillée.');
        $query = ModuleProfessor::where('professor_id', $profId)->where('academic_year_id', $currentYear->id)->whereHas('module', fn ($q) => $q->where('institution_id', $request->user()->institution_id));
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
     * Algorithme d'équilibrage par spécialité, département, période semestrielle et volume horaire statutaire.
     */
    public function autoDistribute(Request $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $currentYear = AcademicYear::where('institution_id', $request->user()->institution_id)->find(AcademicContext::yearId());

            if (! $currentYear) {
                return response()->json(['success' => false, 'message' => 'Aucune année universitaire active trouvée.'], 400);
            }
            $currentYear = AcademicYear::whereKey($currentYear->id)->lockForUpdate()->firstOrFail();
            abort_if($currentYear->is_locked, 409, 'Année universitaire verrouillée.');
            $professors = Professor::with(['user', 'department'])->where('institution_id', $request->user()->institution_id)->where('is_active', true)->get();
            abort_if($professors->isEmpty(), 422, 'Aucun enseignant actif.');

            $semesterPeriod = $request->input('semester_period', 'all');

            // 2. Récupérer les modules filtrés selon la période semestrielle choisie (Automne S1/S3/S5/S7/S9 vs Printemps S2/S4/S6/S8/S10 vs Annuel)
            $modulesQuery = Module::with(['filiere.department'])->where('institution_id', $request->user()->institution_id)->whereNotIn('id', ModuleProfessor::where('academic_year_id', $currentYear->id)->select('module_id'));
            if ($semesterPeriod === 'odd' || $semesterPeriod === 'autumn' || $semesterPeriod === 's1') {
                $modulesQuery->whereIn('semester_number', [1, 3, 5, 7, 9]);
            } elseif ($semesterPeriod === 'even' || $semesterPeriod === 'spring' || $semesterPeriod === 's2') {
                $modulesQuery->whereIn('semester_number', [2, 4, 6, 8, 10]);
            } elseif (is_numeric($semesterPeriod)) {
                $modulesQuery->where('semester_number', (int) $semesterPeriod);
            }

            $modules = $modulesQuery->get();
            $groups = Group::where('academic_year_id', $currentYear->id)->whereIn('filiere_id', $modules->pluck('filiere_id'))->get();

            if ($modules->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'Aucun module disponible pour la période semestrielle sélectionnée.'], 400);
            }

            $targetModuleIds = $modules->pluck('id')->toArray();

            // 3. Réinitialisation ciblée des affectations des modules concernés
            DB::transaction(function () use ($currentYear, $professors, $modules, $groups, $targetModuleIds) {
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
                            if ($domain === 'finance' && $profData['dept_code'] === 'SG') {
                                $score += 30;
                            }
                            if ($domain === 'marketing' && in_array($profData['dept_code'], ['SG', 'EA'])) {
                                $score += 30;
                            }
                            if ($domain === 'management' && $profData['dept_code'] === 'SG') {
                                $score += 30;
                            }
                            if ($domain === 'economie' && $profData['dept_code'] === 'EA') {
                                $score += 30;
                            }
                            if ($domain === 'informatique' && $profData['dept_code'] === 'IG') {
                                $score += 40;
                            }
                            if ($domain === 'droit' && $profData['dept_code'] === 'DA') {
                                $score += 40;
                            }
                            if ($domain === 'langues' && $profData['dept_code'] === 'LC') {
                                $score += 40;
                            }
                        }
                    }

                    return $score;
                };

                // Construire la liste de toutes les charges à pourvoir
                // Règle ENCG (Option B Amphithéâtre) :
                // Pour chaque module, le CM est assuré par UN SEUL professeur titulaire pour toute la section (G1 + G2 réunis en Amphi).
                // On affecte donc 1 charge par Module, qui s'applique à tous les groupes de la filière.
                $chargeSlots = [];
                foreach ($modules as $mod) {
                    if (! $mod->credit_hours || $mod->credit_hours <= 0) {
                        continue;
                    }
                    $modGroups = $groups->where('filiere_id', $mod->filiere_id)->where('semester_number', $mod->semester_number)->values();
                    if ($modGroups->isEmpty()) {
                        continue;
                    }
                    $chargeSlots[] = [
                        'module' => $mod,
                        'groups' => $modGroups,
                        'hours' => (int) $mod->credit_hours,
                        'type' => 'cm',
                    ];
                }

                $totalSlots = count($chargeSlots);
                $totalProfs = count($professors);
                // Plafond strict par enseignant
                $maxPerProf = (int) ceil($totalSlots / max(1, $totalProfs));
                $targetPerProf = (int) floor($totalSlots / max(1, $totalProfs));

                // PASSE 1 : Affectation par Spécialité et Département avec limite stricte (maxPerProf)
                foreach ($chargeSlots as $slotIndex => $slot) {
                    $mod = $slot['module'];
                    $modGroups = $slot['groups'];
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
                        'group_id' => null, // Section entière (G1 + G2 réunis en Amphi)
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
                // S'assurer que les enseignants ont une charge équilibrée tout en préservant l'unité du module
                for ($iter = 0; $iter < 30; $iter++) {
                    $minLoad = min(array_column($profLoads, 'assigned_count'));
                    $maxLoad = max(array_column($profLoads, 'assigned_count'));

                    if (($maxLoad - $minLoad) <= 1) {
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
                        ->whereIn('module_id', $targetModuleIds)
                        ->where('professor_id', $overloadedProfId)
                        ->get()
                        ->first(function ($item) use ($underloadedProfId, $assignedProfessorsByModule) {
                            return ! in_array($underloadedProfId, $assignedProfessorsByModule[$item->module_id] ?? []);
                        });

                    if ($transferable) {
                        $modId = $transferable->module_id;
                        // Mettre à jour tous les groupes de ce module vers le nouveau prof pour préserver l'unité CM
                        ModuleProfessor::where('academic_year_id', $currentYear->id)
                            ->where('module_id', $modId)
                            ->update(['professor_id' => $underloadedProfId]);

                        $assignedProfessorsByModule[$modId] = array_values(array_diff($assignedProfessorsByModule[$modId] ?? [], [$overloadedProfId]));
                        $assignedProfessorsByModule[$modId][] = $underloadedProfId;

                        $profLoads[$overloadedProfId]['assigned_count'] -= 1;
                        $profLoads[$overloadedProfId]['total_hours'] -= $transferable->assigned_hours;
                        $profLoads[$underloadedProfId]['assigned_count'] += 1;
                        $profLoads[$underloadedProfId]['total_hours'] += $transferable->assigned_hours;
                    } else {
                        break;
                    }
                }
            });

            // Statistiques globales de répartition
            $allAssignedProfs = ModuleProfessor::where('academic_year_id', $currentYear->id)
                ->whereHas('module', fn ($q) => $q->where('institution_id', $request->user()->institution_id))
                ->distinct('professor_id')
                ->count('professor_id');

            $totalAssignmentsCount = ModuleProfessor::where('academic_year_id', $currentYear->id)->whereHas('module', fn ($q) => $q->where('institution_id', $request->user()->institution_id))->count();

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
        });
    }
}
