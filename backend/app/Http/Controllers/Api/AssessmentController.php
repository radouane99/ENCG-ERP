<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Module;
use App\Models\ModulePvSignature;
use App\Services\Academic\AcademicContext;
use App\Services\Security\ProfessorAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AssessmentController extends Controller
{
    public function __construct(
        private ProfessorAccessService $accessService
    ) {}

    /**
     * Récupérer les évaluations d'un module.
     */
    public function getForModule(Module $module, Request $request): JsonResponse
    {
        if (! $this->accessService->isAuthorizedForModule($request->user(), $module->id)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json(['data' => $module->assessments]);
    }

    /**
     * Synchroniser les évaluations d'un module.
     */
    public function storeForModule(Module $module, Request $request): JsonResponse
    {
        if (! $this->accessService->isAuthorizedForModule($request->user(), $module->id)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $validated = $request->validate([
            'assessments' => 'required|array|min:1',
            'assessments.*.id' => ['nullable', 'integer', 'distinct', Rule::exists('assessments', 'id')->where('module_id', $module->id)->where('academic_year_id', AcademicContext::yearId())->where('needs_review', false)],
            'assessments.*.type' => 'required|string|max:50|distinct:ignore_case',
            'assessments.*.weight' => 'required|numeric|min:0|max:100',
        ]);

        // Vérifier la somme des poids (hors rattrapage)
        $ordinarySum = collect($validated['assessments'])
            ->filter(fn ($a) => strtolower($a['type']) !== 'rattrapage')
            ->sum(fn ($a) => floatval($a['weight']));

        if (count($validated['assessments']) > 0 && abs($ordinarySum - 100) > 0.01) {
            return response()->json([
                'message' => "La somme des poids doit être égale à 100% (Actuellement: {$ordinarySum}%)",
            ], 422);
        }

        return DB::transaction(function () use ($module, $validated) {
            $module->newQuery()->whereKey($module->id)->lockForUpdate()->firstOrFail();
            abort_if(ModulePvSignature::where('module_id', $module->id)->exists(), 409, 'PV signé : modalités verrouillées.');
            $ids = array_filter(array_column($validated['assessments'], 'id'));
            abort_if($module->assessments()->whereNotIn('id', $ids)->whereHas('grades')->exists(), 409, 'Une évaluation notée ne peut pas être supprimée.');
            $savedIds = [];
            foreach ($validated['assessments'] as $aData) {
                if (! empty($aData['id'])) {
                    $assessment = Assessment::where('id', $aData['id'])->where('module_id', $module->id)->first();
                    if ($assessment) {
                        $assessment->update(['type' => $aData['type'], 'weight' => floatval($aData['weight'])]);
                        $savedIds[] = $assessment->id;

                        continue;
                    }
                }

                $assessment = Assessment::create([
                    'module_id' => $module->id,
                    'type' => $aData['type'],
                    'weight' => floatval($aData['weight']),
                    'date' => now()->format('Y-m-d'),
                ]);
                $savedIds[] = $assessment->id;
            }

            // Supprimer les évaluations non présentes dans la liste
            $module->assessments()->whereNotIn('id', $savedIds)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Modalités d\'évaluation enregistrées.',
                'data' => $module->fresh()->assessments,
            ]);
        });
    }
}
