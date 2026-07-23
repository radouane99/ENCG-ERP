<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\JsonResponse;

use App\Models\Assessment;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    /**
     * Get all assessments for a given module.
     */
    public function getForModule(Module $module, Request $request): JsonResponse
    {
        $user = $request->user();

        // 🛡️ ROLE-BASED ACCESS CONTROL (RBAC)
        if ($user && $user->hasRole(['professor', 'vacataire'])) {
            $prof = \App\Models\Professor::where('user_id', $user->id)->first();
            if (!$prof) {
                return response()->json(['message' => 'Profil professeur introuvable.'], 403);
            }

            $isAssigned = \Illuminate\Support\Facades\DB::table('module_professor')
                ->where('professor_id', $prof->id)
                ->where('module_id', $module->id)
                ->exists();

            if (!$isAssigned) {
                return response()->json([
                    'message' => 'Accès refusé : Vous n\'êtes pas assigné à ce module.'
                ], 403);
            }
        }

        return response()->json([
            'data' => $module->assessments
        ]);
    }

    /**
     * Sync assessments for a module.
     */
    public function storeForModule(Module $module, Request $request): JsonResponse
    {
        $user = $request->user();

        // 🛡️ ROLE-BASED ACCESS CONTROL (RBAC)
        if ($user && $user->hasRole(['professor', 'vacataire'])) {
            $prof = \App\Models\Professor::where('user_id', $user->id)->first();
            if (!$prof) {
                return response()->json(['message' => 'Profil professeur introuvable.'], 403);
            }

            $isAssigned = \Illuminate\Support\Facades\DB::table('module_professor')
                ->where('professor_id', $prof->id)
                ->where('module_id', $module->id)
                ->exists();

            if (!$isAssigned) {
                return response()->json([
                    'message' => 'Accès refusé : Vous n\'êtes pas autorisé à modifier les évaluations de ce module.'
                ], 403);
            }
        }

        $validated = $request->validate([
            'assessments' => 'required|array',
            'assessments.*.id' => 'nullable|integer',
            'assessments.*.type' => 'required|string|max:50',
            'assessments.*.weight' => 'required|numeric|min:0|max:100',
        ]);

        $sumWeights = 0;
        foreach ($validated['assessments'] as $aData) {
            $sumWeights += floatval($aData['weight']);
        }

        if (count($validated['assessments']) > 0 && abs($sumWeights - 100) > 0.01) {
            return response()->json([
                'message' => 'La somme des poids doit être égale à 100% (Actuellement: ' . $sumWeights . '%)'
            ], 422);
        }

        $savedIds = [];
        foreach ($validated['assessments'] as $aData) {
            if (!empty($aData['id'])) {
                $assessment = Assessment::where('id', $aData['id'])->where('module_id', $module->id)->first();
                if ($assessment) {
                    $assessment->update([
                        'type' => $aData['type'],
                        'weight' => floatval($aData['weight']),
                    ]);
                    $savedIds[] = $assessment->id;
                    continue;
                }
            }

            $assessment = Assessment::create([
                'module_id' => $module->id,
                'type' => $aData['type'],
                'weight' => floatval($aData['weight']),
                'date' => now()->format('Y-m-d')
            ]);
            $savedIds[] = $assessment->id;
        }

        // Delete assessments that are not in the list
        $module->assessments()->whereNotIn('id', $savedIds)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Modalités d\'évaluation enregistrées avec succès.',
            'data' => $module->fresh()->assessments
        ]);
    }
}
