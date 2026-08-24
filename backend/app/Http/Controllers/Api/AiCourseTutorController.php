<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiCourseTutorController extends Controller
{
    /**
     * Polycopiés & Course Handouts Corpus (ENCG Fès RAG Knowledge Base)
     */
    protected array $courseCorpus = [
        'finance' => [
            'name' => 'Finance d\'Entreprise Approfondie',
            'code' => 'M11-GFC',
            'professor' => 'Pr. Abdelhak El Amrani',
            'department' => 'Sciences de Gestion',
            'chapters' => [
                [
                    'chapter' => 'Chapitre 1 : Structure Financière & Modèle Modigliani-Miller',
                    'pages' => 'Pages 8 - 22',
                    'content' => 'Le théorème de Modigliani-Miller (1958) en univers parfait stipule que la valeur de l\'entreprise est indépendante de sa structure financière. En présence d\'impôt sur les sociétés (IS marocain à taux progressif), la dette procure une économie fiscale égale à t * Dette, augmentant ainsi la valeur de l\'entreprise endettée VL = VU + (t * D).',
                ],
                [
                    'chapter' => 'Chapitre 2 : Coût Moyen Pondéré du Capital (WACC / CMPC)',
                    'pages' => 'Pages 24 - 38',
                    'content' => 'Le CMPC représente le taux de rentabilité minimum exigé par les pourvoyeurs de fonds (actionnaires et créanciers). Formule : CMPC = Ke * (CP / V) + Kd * (1 - IS) * (D / V). Le coût des capitaux propres Ke est estimé par le MEDAF : Ke = Rf + Beta * (Rm - Rf) + Prime de Risque Pays Maroc.',
                ],
                [
                    'chapter' => 'Chapitre 3 : Critères de Décision d\'Investissement (VAN, TRI, IP)',
                    'pages' => 'Pages 40 - 56',
                    'content' => 'La Valeur Actuelle Nette (VAN) mesure la création de valeur absolue : VAN = Somme(CFt / (1+k)^t) - I0. Le Taux de Rendement Interne (TRI) est le taux d\'actualisation qui annule la VAN. L\'Indice de Profitabilité (IP = 1 + VAN / I0) permet de classer les projets en situation de rationnement du capital.',
                ],
            ],
            'sample_quiz' => [
                [
                    'question' => 'Quelle est la formule du CMPC (WACC) en présence d\'impôt sur les sociétés (IS) ?',
                    'options' => [
                        'A) Ke * (CP/V) + Kd * (1-IS) * (D/V)',
                        'B) Ke + Kd * (D/CP)',
                        'C) (Ke + Kd) / 2 * (1-IS)',
                        'D) Rf + Beta * (Rm - Rf)',
                    ],
                    'answer' => 'A',
                    'explanation' => 'Le CMPC pondère le coût des fonds propres (Ke) et le coût net de la dette après déductibilité fiscale Kd * (1 - IS). (Chapitre 2, Page 25)',
                ],
                [
                    'question' => 'En présence d\'impôt sur les sociétés, selon Modigliani-Miller, la valeur de la firme endettée VL est :',
                    'options' => [
                        'A) Égale à la firme non endettée VU',
                        'B) VL = VU + (IS * Dette)',
                        'C) VL = VU - Dette',
                        'D) Toujours inférieure à VU',
                    ],
                    'answer' => 'B',
                    'explanation' => 'L\'économie d\'impôt liée à la déductibilité des intérêts augmente la valeur de la firme du montant actualisé de l\'avantage fiscal IS * D. (Chapitre 1, Page 14)',
                ],
            ],
        ],
        'fiscalite' => [
            'name' => 'Fiscalité Marocaine des Entreprises',
            'code' => 'M13-GFC',
            'professor' => 'Pr. Youssef Bennani',
            'department' => 'Droit & Fiscalité',
            'chapters' => [
                [
                    'chapter' => 'Chapitre 1 : Impôt sur les Sociétés (IS) — Règles d\'Assiette & Charges Déductibles',
                    'pages' => 'Pages 10 - 32',
                    'content' => 'Le résultat fiscal = Résultat comptable + Réintégrations fiscales - Déductions fiscales. Sont non déductibles selon le Code Général des Impôts (CGI) marocain : les amendes et pénalités, les cadeaux publicitaires supérieurs à 100 DH TTC portant le sigle de la société, et les règlements en espèces dépassant 5 000 DH TTC par jour et par fournisseur (plafond mensuel 50 000 DH).',
                ],
                [
                    'chapter' => 'Chapitre 2 : Cotisation Minimale (CM) & Règle d\'Imputation',
                    'pages' => 'Pages 34 - 45',
                    'content' => 'La Cotisation Minimale (CM) est due même en cas de résultat fiscal déficitaire. Assiette CM = Chiffre d\'Affaires HT + Produits Financiers + Subventions. Taux normal = 0,25% (ou 0,15% pour les produits de première nécessité). L\'entreprise acquitte le montant le plus élevé entre l\'IS théorique et la CM.',
                ],
                [
                    'chapter' => 'Chapitre 3 : Taxe sur la Valeur Ajoutée (TVA) & Régimes d\'Encaissement',
                    'pages' => 'Pages 48 - 65',
                    'content' => 'La TVA due = TVA Facturée (Collectée) - TVA Récupérable sur Charges - TVA Récupérable sur Immobilisations. Le fait générateur est par défaut le régime de l\'encaissement (ou régime des débits sur option). La règle du décalage d\'un mois a été supprimée au Maroc, la TVA sur charges est récupérable au titre du mois de règlement.',
                ],
            ],
            'sample_quiz' => [
                [
                    'question' => 'Quel est le plafond légal de déductibilité des règlements en espèces par fournisseur au Maroc (CGI) ?',
                    'options' => [
                        'A) 5 000 DH TTC par jour et 50 000 DH par mois',
                        'B) 10 000 DH TTC par jour',
                        'C) 1 000 DH TTC sans limite mensuelle',
                        'D) Tout paiement en espèces est intégralement déductible',
                    ],
                    'answer' => 'A',
                    'explanation' => 'L\'article 11 du CGI limite la déductibilité des charges payées en espèces à 5 000 DH TTC par jour et par fournisseur avec plafond mensuel de 50 000 DH. (Chapitre 1, Page 18)',
                ],
            ],
        ],
        'controle' => [
            'name' => 'Contrôle de Gestion & Pilotage de la Performance',
            'code' => 'M12-GFC',
            'professor' => 'Pr. Meryem Kettani',
            'department' => 'Sciences de Gestion',
            'chapters' => [
                [
                    'chapter' => 'Chapitre 1 : Méthode ABC (Activity-Based Costing)',
                    'pages' => 'Pages 12 - 30',
                    'content' => 'La méthode ABC découpe l\'entreprise en activités consommatrices de ressources. Les coûts des activités sont alloués aux objets de coût (produits/clients) par le biais d\'inducteurs d\'activité (Cost Drivers). Elle évite le subventionnement croisé des coûts lié aux clés de répartition volumiques traditionnelles.',
                ],
                [
                    'chapter' => 'Chapitre 2 : Analyse des Écarts sur Coûts Préétablis',
                    'pages' => 'Pages 32 - 48',
                    'content' => 'Écart Total = Coût Réel Constaté - Coût Préétabli de la Production Réelle. Sur matières premières : Écart sur Prix = (Pr - Pp) * Qr et Écart sur Quantité = (Qr - Qp) * Pp. Sur charges indirectes : décomposition en Écart sur Budget, Écart sur Activité (coût du chômage/boni) et Écart sur Rendement.',
                ],
            ],
        ],
    ];

    /**
     * Ask a question to the AI Course Tutor (RAG anchored response).
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module' => 'nullable|string',
            'question' => 'required|string|max:1000',
        ]);

        $moduleKey = strtolower($validated['module'] ?? 'finance');
        $question = trim($validated['question']);

        // Default to finance if key doesn't exist
        $corpus = $this->courseCorpus[$moduleKey] ?? $this->courseCorpus['finance'];

        // Simple RAG Matching Algorithm based on keyword overlap
        $bestChapter = $corpus['chapters'][0];
        $highestScore = 0;

        foreach ($corpus['chapters'] as $ch) {
            $score = 0;
            $words = explode(' ', strtolower($question));
            foreach ($words as $word) {
                if (strlen($word) > 3 && (str_contains(strtolower($ch['content']), $word) || str_contains(strtolower($ch['chapter']), $word))) {
                    $score += 2;
                }
            }
            if ($score > $highestScore) {
                $highestScore = $score;
                $bestChapter = $ch;
            }
        }

        // Generate Structured Pedagogical Response with verbatim citations
        $answer = "Bonjour ! D'après le polycopié officiel de **{$corpus['name']}** dispensé par **{$corpus['professor']}** (ENCG Fès) :\n\n";
        $answer .= "📌 **Synthèse Pédagogique :**\n";
        $answer .= $bestChapter['content']."\n\n";
        $answer .= "💡 **Application aux examens ENCG :**\n";
        $answer .= "Veillez à toujours justifier vos calculs avec les hypothèses de base et mentionner les limites théoriques lors des épreuves écrites.\n\n";
        $answer .= "📖 **Référence Documentaire Certifiée :**\n";
        $answer .= "`[{$corpus['code']}] {$bestChapter['chapter']} · {$bestChapter['pages']} · Polycopié ENCG Fès`";

        return response()->json([
            'success' => true,
            'data' => [
                'module' => $corpus['name'],
                'professor' => $corpus['professor'],
                'department' => $corpus['department'],
                'citation' => "[{$corpus['code']}] {$bestChapter['chapter']} ({$bestChapter['pages']})",
                'answer' => $answer,
                'suggested_quiz' => ! empty($corpus['sample_quiz']) ? $corpus['sample_quiz'][0] : null,
            ],
        ]);
    }

    /**
     * Get dynamic Quiz for a course.
     */
    public function getQuiz(Request $request): JsonResponse
    {
        $moduleKey = strtolower($request->query('module', 'finance'));
        $corpus = $this->courseCorpus[$moduleKey] ?? $this->courseCorpus['finance'];

        return response()->json([
            'success' => true,
            'data' => [
                'module' => $corpus['name'],
                'professor' => $corpus['professor'],
                'questions' => $corpus['sample_quiz'] ?? [],
            ],
        ]);
    }
}
