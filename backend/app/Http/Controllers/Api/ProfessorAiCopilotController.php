<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LearningMaterial;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProfessorAiCopilotController extends Controller
{
    /**
     * Génération automatique d'une trame de Cahier de Texte basée sur les supports du module.
     */
    public function generateTextbookOutline(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'session_count' => 'nullable|integer|min:1|max:24',
        ]);

        $module = Module::with('filiere')->findOrFail($validated['module_id']);
        $sessionCount = $validated['session_count'] ?? 12;

        // Récupérer les supports de cours en base
        $materials = LearningMaterial::where('module_id', $module->id)->pluck('title')->implode(', ');
        if (empty($materials)) {
            $materials = "Syllabus officiel, Polycopié de cours et travaux dirigés de {$module->name}";
        }

        $apiKey = env('GEMINI_API_KEY');

        if (! $apiKey) {
            // Generateur de trame intelligente structurée
            $outline = $this->generateFallbackOutline($module, $sessionCount);

            return response()->json([
                'success' => true,
                'source' => 'internal_engine',
                'data' => $outline,
            ]);
        }

        try {
            $prompt = 'Tu es un Conseiller Pédagogique Expert des Écoles Nationales de Commerce et de Gestion (ENCG Maroc). '
                ."Génère une trame structurée de Cahier de Texte pour le module '{$module->name}' ({$module->filiere?->name}) contenant exactement {$sessionCount} séances. "
                ."Supports disponibles: {$materials}. "
                ."Réponds STRICTEMENT sous forme de JSON valide avec la clé 'sessions' qui est un tableau d'objets ayant les attributs: "
                ."'session_number' (int), 'title' (string), 'objectives' (string), 'topics' (string), 'duration_hours' (int, ex 3).";

            $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                'contents' => [
                    ['parts' => [['text' => $prompt]]],
                ],
            ]);

            $jsonText = $response->json('candidates.0.content.parts.0.text');
            if ($jsonText) {
                // Nettoyer les balises markdown ```json ... ```
                $cleanJson = preg_replace('/^```json\s*|\s*```$/i', '', trim($jsonText));
                $parsed = json_decode($cleanJson, true);
                if (isset($parsed['sessions'])) {
                    return response()->json([
                        'success' => true,
                        'source' => 'gemini_1.5',
                        'data' => $parsed['sessions'],
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Gemini AI Textbook Outline failed: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'source' => 'fallback',
            'data' => $this->generateFallbackOutline($module, $sessionCount),
        ]);
    }

    /**
     * Génération assistée d'un Sujet d'Examen et Barème détaillé (20 pts).
     */
    public function generateExamPaper(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'exam_type' => 'required|string|in:case_study,qcm,mixed,reflection',
            'difficulty' => 'required|string|in:standard,advanced,master',
            'duration' => 'nullable|string|max:50',
            'instructions' => 'nullable|string|max:1000',
            'locale_context' => 'nullable|string|in:fes,generic',
        ]);

        $module = Module::with('filiere')->findOrFail($validated['module_id']);
        $apiKey = env('GEMINI_API_KEY');

        $typeLabels = [
            'case_study' => 'Étude de Cas Réelle ENCG avec Analyse Stratégique',
            'qcm' => 'QCM à Choix Multiples Rigoureux (20 questions)',
            'mixed' => 'Épreuve Mixte (Étude de Cas + QCM + Questions Directes)',
            'reflection' => 'Dissertation / Question de Réflexion Managériale',
        ];

        $typeLabel = $typeLabels[$validated['exam_type']] ?? 'Épreuve Standard ENCG';
        $instructions = $validated['instructions'] ?? 'Épreuve officielle de fin de semestre ENCG Fès';
        $locale = $validated['locale_context'] ?? 'generic';
        $fesHint = $locale === 'fes'
            ? ' Ancrer le cas dans l’écosystème de Fès (agroalimentaire, textile, logistique, artisanat). Barème LMD : aucune note type inférieure à 6/20 dans le corrigé.'
            : '';

        if (! $apiKey) {
            return response()->json([
                'success' => true,
                'source' => 'internal_engine',
                'data' => $this->generateFallbackExamPaper($module, $typeLabel, $instructions, $locale),
            ]);
        }

        try {
            $prompt = "Tu es un Professeur Universitaire à l'ENCG Fès (Université Sidi Mohamed Ben Abdellah). "
                ."Rédige un sujet d'examen officiel et complet pour le module '{$module->name}' ({$module->filiere?->name}). "
                ."Format: {$typeLabel}. Niveau: {$validated['difficulty']}. Consignes particulières: {$instructions}.{$fesHint} "
                ."Barème LMD ENCG : validation ≥ 10/20, éliminatoire < 6/20 — ne propose pas de corrigé type avec une note < 6. "
                ."Réponds STRICTEMENT au format JSON valide avec les clés suivantes:\n"
                ."- 'title' (string): Intitulé officiel du sujet\n"
                ."- 'context' (string): Contexte entreprise / mise en situation de 2 paragraphes\n"
                ."- 'sections' (array d'objets): chaque section ayant 'section_title' (string), 'points' (int), 'questions' (array d'objets avec 'num' (string), 'text' (string), 'points' (numeric), 'expected_answer' (string))\n"
                ."- 'rubric' (array d'objets): grille d'évaluation avec 'criteria' (string), 'points' (numeric), 'description' (string)\n"
                ."- 'total_points' (int, doit valoir 20)";

            $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                'contents' => [
                    ['parts' => [['text' => $prompt]]],
                ],
            ]);

            $jsonText = $response->json('candidates.0.content.parts.0.text');
            if ($jsonText) {
                $cleanJson = preg_replace('/^```json\s*|\s*```$/i', '', trim($jsonText));
                $parsed = json_decode($cleanJson, true);
                if (isset($parsed['title']) && isset($parsed['sections'])) {
                    return response()->json([
                        'success' => true,
                        'source' => 'gemini_1.5',
                        'data' => $parsed,
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Gemini AI Exam Generation failed: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'source' => 'fallback',
            'data' => $this->generateFallbackExamPaper($module, $typeLabel, $instructions, $locale),
        ]);
    }

    private function generateFallbackOutline(Module $module, int $count): array
    {
        $sessions = [];
        $topics = [
            "Introduction aux concepts fondamentaux de {$module->name}",
            'Cadre théoretique et enjeux managériaux actuels',
            'Analyse diagnostique et prise de décision stratégique',
            'Étude des processus clés et modélisation opérationnelle',
            "Travaux Dirigés & Analyse d'études de cas d'entreprises",
            'Évaluation intermédiaire et revue des acquis pédagogiques',
            'Outils de pilotage et indicateurs de performance (KPIs)',
            'Stratégie de mise en œuvre et conduite du changement',
            'Gestion des risques et conformité réglementaire',
            'Étude comparative et meilleures pratiques internationales',
            'Atelier pratique & Préparation à la soutenance de projet',
            'Synthèse globale du module et révision générale',
        ];

        for ($i = 1; $i <= $count; $i++) {
            $topic = $topics[($i - 1) % count($topics)];
            $sessions[] = [
                'session_number' => $i,
                'title' => "Séance {$i} : {$topic}",
                'objectives' => "Assimiler les principes majeurs de {$topic} et appliquer les grilles d'analyse ENCG.",
                'topics' => "Concepts clés, études d'exemples concrets, calculs d'indicateurs et débats interactifs.",
                'duration_hours' => 3,
            ];
        }

        return $sessions;
    }

    private function generateFallbackExamPaper(Module $module, string $typeLabel, string $instructions, string $locale = 'generic'): array
    {
        $context = $locale === 'fes'
            ? "Une coopérative agroalimentaire de Fès, un atelier textile du quartier de Ain Nokbi et un opérateur logistique du corridor Fès–Tanger Med vous sollicitent. Le tissu artisanal fassi (zellige, tannerie) impose des contraintes de traçabilité. Vous êtes mandaté(e) en tant qu'expert-conseil diplômé de l'ENCG Fès."
            : "Le Groupe ATLAS Commerce, leader marocain de la distribution et de la gestion des opérations, fait face à une transformation majeure de ses processus managériaux. Vous êtes mandaté(e) en tant qu'expert-conseil diplômé de l'ENCG Fès pour analyser la situation et formuler des recommandations stratégiques.";

        return [
            'title' => "Épreuve Finale Officielle : {$module->name}",
            'context' => $context,
            'locale_context' => $locale,
            'lmd_note' => 'Barème LMD : aucune note type < 6/20.',
            'total_points' => 20,
            'sections' => [
                [
                    'section_title' => 'Partie 1 : Diagnostic Strategique & Analyse (8 Points)',
                    'points' => 8,
                    'questions' => [
                        [
                            'num' => '1.1',
                            'text' => "Identifiez et analysez les trois facteurs clés de succès liés à {$module->name} dans ce contexte.",
                            'points' => 4,
                            'expected_answer' => "Rigueur de l'analyse, adéquation avec les principes du module et justification managériale.",
                        ],
                        [
                            'num' => '1.2',
                            'text' => 'Proposez une matrice de diagnostic évaluant les forces et faiblesses opérationnelles du Groupe.',
                            'points' => 4,
                            'expected_answer' => 'Clarté de la matrice, pertinence des indicateurs retenus et faisabilité.',
                        ],
                    ],
                ],
                [
                    'section_title' => 'Partie 2 : Recommandations & Plan d\'Action (12 Points)',
                    'points' => 12,
                    'questions' => [
                        [
                            'num' => '2.1',
                            'text' => "Formulez un plan d'action opérationnel décliné en 4 étapes clés avec indicateurs de mesure (KPIs).",
                            'points' => 6,
                            'expected_answer' => "Plan d'action chronologique, réalisme budgétaire et KPIs de contrôle.",
                        ],
                        [
                            'num' => '2.2',
                            'text' => "Rédigez une note de synthèse à l'attention de la Direction Générale résumant vos préconisations.",
                            'points' => 6,
                            'expected_answer' => 'Qualité rédactionnelle, esprit de synthèse et vision globale.',
                        ],
                    ],
                ],
            ],
            'rubric' => [
                ['criteria' => 'Compréhension du sujet & Rigueur académique', 'points' => 5, 'description' => 'Maîtrise des concepts et vocabulaire technique ENCG.'],
                ['criteria' => 'Pertinence des analyses & Diagnostics', 'points' => 8, 'description' => 'Profondeur du raisonnement et exploitation des données.'],
                ['criteria' => 'Qualité des recommandations & Plan d\'action', 'points' => 5, 'description' => 'Faisabilité, pragmatisme et mesure de performance.'],
                ['criteria' => 'Présentation & Qualité rédactionnelle', 'points' => 2, 'description' => 'Clarté, structure des paragraphes et respect de la forme.'],
            ],
        ];
    }
}
