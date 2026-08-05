<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    /**
     * Récupérer les évaluations d'un module.
     */
    public function getForModule(Module $module, Request $request): JsonResponse
    {
        if (!$this->isAuthorizedForModule($request->user(), $module)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json(['data' => $module->assessments]);
    }

    /**
     * Synchroniser les évaluations d'un module.
     */
    public function storeForModule(Module $module, Request $request): JsonResponse
    {
        if (!$this->isAuthorizedForModule($request->user(), $module)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $validated = $request->validate([
            'assessments'             => 'required|array',
            'assessments.*.id'       => 'nullable|integer',
            'assessments.*.type'     => 'required|string|max:50',
            'assessments.*.weight'   => 'required|numeric|min:0|max:100',
        ]);

        // Vérifier la somme des poids (hors rattrapage)
        $ordinarySum = collect($validated['assessments'])
            ->filter(fn($a) => strtolower($a['type']) !== 'rattrapage')
            ->sum(fn($a) => floatval($a['weight']));

        if (count($validated['assessments']) > 0 && abs($ordinarySum - 100) > 0.01) {
            return response()->json([
                'message' => "La somme des poids doit être égale à 100% (Actuellement: {$ordinarySum}%)",
            ], 422);
        }

        $savedIds = [];
        foreach ($validated['assessments'] as $aData) {
            if (!empty($aData['id'])) {
                $assessment = Assessment::where('id', $aData['id'])->where('module_id', $module->id)->first();
                if ($assessment) {
                    $assessment->update(['type' => $aData['type'], 'weight' => floatval($aData['weight'])]);
                    $savedIds[] = $assessment->id;
                    continue;
                }
            }

            $assessment = Assessment::create([
                'module_id' => $module->id,
                'type'      => $aData['type'],
                'weight'    => floatval($aData['weight']),
                'date'      => now()->format('Y-m-d'),
            ]);
            $savedIds[] = $assessment->id;
        }

        // Supprimer les évaluations non présentes dans la liste
        $module->assessments()->whereNotIn('id', $savedIds)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Modalités d\'évaluation enregistrées.',
            'data'    => $module->fresh()->assessments,
        ]);
    }

    /**
     * Vérifie que l'utilisateur (professeur/vacataire) est assigné au module.
     */
    private function isAuthorizedForModule($user, Module $module): bool
    {
        // Les admins passent toujours
        if (!$user || !$user->roles->pluck('name')->intersect(['professor', 'vacataire'])->isNotEmpty()) {
            return true;
        }

        $prof = Professor::where('user_id', $user->id)->first();
        if (!$prof) return false;

        return ModuleProfessor::where('professor_id', $prof->id)
            ->where('module_id', $module->id)
            ->exists();
    }
}