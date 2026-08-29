<?php

namespace App\Services\Academic;

use App\Models\Grade;
use App\Models\Student;

class OrientationAdvisorService
{
    /**
     * Filières de spécialités ENCG avec leurs profils de pondération par discipline.
     */
    protected array $specializationProfiles = [
        'GFC' => [
            'name' => 'Gestion Financière et Comptable',
            'code' => 'GFC',
            'icon' => 'Landmark',
            'description' => 'Spécialisation d\'élite en ingénierie financière, audit bancaire, marchés des capitaux et contrôle financier des grands groupes.',
            'career_prospects' => [
                'Directeur Administratif et Financier (DAF)',
                'Analyste Financier / M&A',
                'Gestionnaire de Portefeuille / Trader',
                'Auditeur Financier Senior',
            ],
            'weights' => [
                'finance' => 0.40,
                'accounting' => 0.35,
                'quantitative' => 0.15,
                'law' => 0.05,
                'management' => 0.05,
            ],
            'keywords' => ['finance', 'comptabilite', 'comptabilité', 'monnaie', 'banque', 'fiscalite', 'fiscalité', 'mathematiques financieres', 'mathématiques financières', 'tresorerie', 'trésorerie'],
        ],
        'MCM' => [
            'name' => 'Management Commercial et Marketing',
            'code' => 'MCM',
            'icon' => 'TrendingUp',
            'description' => 'Formation avancée en stratégie marketing omnicanale, négociation B2B, marketing digital et développement international.',
            'career_prospects' => [
                'Directeur Marketing & Communication',
                'Brand Manager / Chef de Produit',
                'Directeur du Développement Commercial',
                'Consultant Growth & Digital Marketing',
            ],
            'weights' => [
                'marketing' => 0.40,
                'commercial' => 0.30,
                'management' => 0.15,
                'communication' => 0.10,
                'quantitative' => 0.05,
            ],
            'keywords' => ['marketing', 'commercial', 'vente', 'consommateur', 'communication', 'etude de marche', 'étude de marché', 'negociation', 'négociation'],
        ],
        'ACG' => [
            'name' => 'Audit et Contrôle de Gestion',
            'code' => 'ACG',
            'icon' => 'ShieldCheck',
            'description' => 'Filière d\'excellence pour le pilotage de la performance, l\'audit interne et externe (Big Four), la gestion des risques et la gouvernance.',
            'career_prospects' => [
                'Auditeur Interne / Externe (Big 4)',
                'Contrôleur de Gestion Industriel / Groupe',
                'Risk Manager & Compliance Officer',
                'Consultant en Organisation & SI',
            ],
            'weights' => [
                'accounting' => 0.35,
                'finance' => 0.25,
                'management' => 0.20,
                'quantitative' => 0.10,
                'law' => 0.10,
            ],
            'keywords' => ['audit', 'controle de gestion', 'contrôle de gestion', 'comptabilite analytique', 'comptabilité analytique', 'performance', 'couts', 'coûts'],
        ],
        'GRH' => [
            'name' => 'Management des Ressources Humaines',
            'code' => 'GRH',
            'icon' => 'Users',
            'description' => 'Leadership stratégique, développement des talents, droit du travail avancé et transformation organisationnelle des entreprises.',
            'career_prospects' => [
                'Directeur des Ressources Humaines (DRH)',
                'Responsable Gestion des Talents & Recrutement',
                'Consultant en Conduite du Changement',
                'Responsable Relations Sociales & RSE',
            ],
            'weights' => [
                'management' => 0.40,
                'communication' => 0.25,
                'law' => 0.20,
                'marketing' => 0.10,
                'quantitative' => 0.05,
            ],
            'keywords' => ['ressources humaines', 'grh', 'rh', 'sociologie', 'droit du travail', 'organisation', 'psychologie', 'comportement'],
        ],
        'MACI' => [
            'name' => 'Management du Commerce International',
            'code' => 'MACI',
            'icon' => 'Globe',
            'description' => 'Commerce international, logistique globale & Supply Chain, douanes et géostratégie des échanges mondiaux.',
            'career_prospects' => [
                'Directeur Export / International Business',
                'Supply Chain & Logistics Manager',
                'Courtier Maritime / Douanes',
                'Responsable Achats Internationaux',
            ],
            'weights' => [
                'commercial' => 0.35,
                'communication' => 0.25,
                'marketing' => 0.20,
                'finance' => 0.10,
                'law' => 0.10,
            ],
            'keywords' => ['international', 'commerce international', 'douane', 'logistique', 'supply chain', 'import', 'export', 'langues', 'anglais'],
        ],
    ];

    /**
     * Analyse le dossier académique d'un étudiant et génère son orientation IA.
     */
    public function analyzeStudent(Student $student): array
    {
        // 1. Récupérer les notes réelles de l'étudiant
        $grades = Grade::where('student_id', $student->id)
            ->with(['module', 'course'])
            ->get();

        // 2. Extraire les moyennes par domaine de compétences
        $categoryScores = $this->calculateCategoryScores($grades);

        // 3. Calculer le score de compatibilité pour chaque filière de spécialité
        $recommendations = [];
        foreach ($this->specializationProfiles as $code => $profile) {
            $score = $this->computeCompatibilityScore($categoryScores, $profile['weights']);

            // Forces et points d'attention
            $strengths = [];
            $improvements = [];

            foreach ($profile['weights'] as $cat => $weight) {
                $catScore = $categoryScores[$cat] ?? 10.0;
                if ($catScore >= 12.5) {
                    $strengths[] = $this->getCategoryLabel($cat).' ('.number_format($catScore, 2).'/20)';
                } elseif ($catScore < 10.0) {
                    $improvements[] = $this->getCategoryLabel($cat).' ('.number_format($catScore, 2).'/20)';
                }
            }

            $recommendations[] = [
                'code' => $code,
                'name' => $profile['name'],
                'icon' => $profile['icon'],
                'compatibility_score' => round($score, 1),
                'match_level' => $score >= 80 ? 'Idéal' : ($score >= 65 ? 'Favorable' : 'Possible'),
                'description' => $profile['description'],
                'career_prospects' => $profile['career_prospects'],
                'strengths' => $strengths,
                'improvements' => $improvements,
            ];
        }

        // Trier par score de compatibilité décroissant
        usort($recommendations, fn ($a, $b) => $b['compatibility_score'] <=> $a['compatibility_score']);

        // 4. Synthèse Radar
        $radarData = [
            ['subject' => 'Finance & Banque', 'score' => round($categoryScores['finance'] ?? 11.5, 1), 'fullMark' => 20],
            ['subject' => 'Comptabilité & Audit', 'score' => round($categoryScores['accounting'] ?? 12.0, 1), 'fullMark' => 20],
            ['subject' => 'Marketing & Vente', 'score' => round($categoryScores['marketing'] ?? 13.0, 1), 'fullMark' => 20],
            ['subject' => 'Management & RH', 'score' => round($categoryScores['management'] ?? 12.5, 1), 'fullMark' => 20],
            ['subject' => 'Droit & Économie', 'score' => round($categoryScores['law'] ?? 11.0, 1), 'fullMark' => 20],
            ['subject' => 'Outils Quantitatifs', 'score' => round($categoryScores['quantitative'] ?? 10.5, 1), 'fullMark' => 20],
        ];

        // 5. Conseil IA personnalisé
        $topMatch = $recommendations[0];
        $aiVerdict = "Au vu de vos excellents résultats dans les matières analytiques et managériales, la filière {$topMatch['name']} ({$topMatch['code']}) correspond le plus étroitement à vos points forts académiques avec un taux de compatibilité de {$topMatch['compatibility_score']}%.";

        return [
            'student_id' => $student->id,
            'student_name' => $student->user?->name ?? 'Étudiant ENCG',
            'cne' => $student->cne ?? 'N/A',
            'current_semester' => $student->current_semester ?? 2,
            'radar_skills' => $radarData,
            'top_recommendation' => $topMatch,
            'recommendations' => $recommendations,
            'ai_verdict' => $aiVerdict,
            'total_grades_analyzed' => $grades->count(),
        ];
    }

    /**
     * Calcule la moyenne des notes par catégorie de compétence.
     */
    protected function calculateCategoryScores($grades): array
    {
        $categories = [
            'finance' => [],
            'accounting' => [],
            'marketing' => [],
            'commercial' => [],
            'management' => [],
            'communication' => [],
            'law' => [],
            'quantitative' => [],
        ];

        foreach ($grades as $grade) {
            $note = $grade->final_grade ?? $grade->normal_grade ?? $grade->session_1_grade ?? 12.0;
            $moduleName = strtolower($grade->module?->name ?? $grade->course?->name ?? '');

            if (str_contains($moduleName, 'financ') || str_contains($moduleName, 'monnaie') || str_contains($moduleName, 'banque')) {
                $categories['finance'][] = $note;
            }
            if (str_contains($moduleName, 'compta') || str_contains($moduleName, 'audit') || str_contains($moduleName, 'fiscal')) {
                $categories['accounting'][] = $note;
            }
            if (str_contains($moduleName, 'market') || str_contains($moduleName, 'consommateur')) {
                $categories['marketing'][] = $note;
            }
            if (str_contains($moduleName, 'commerce') || str_contains($moduleName, 'vente') || str_contains($moduleName, 'negociation') || str_contains($moduleName, 'négociation')) {
                $categories['commercial'][] = $note;
            }
            if (str_contains($moduleName, 'manage') || str_contains($moduleName, 'organis') || str_contains($moduleName, 'rh') || str_contains($moduleName, 'humain')) {
                $categories['management'][] = $note;
            }
            if (str_contains($moduleName, 'commun') || str_contains($moduleName, 'lang') || str_contains($moduleName, 'anglais') || str_contains($moduleName, 'francais')) {
                $categories['communication'][] = $note;
            }
            if (str_contains($moduleName, 'droit') || str_contains($moduleName, 'jurid') || str_contains($moduleName, 'econo') || str_contains($moduleName, 'écono')) {
                $categories['law'][] = $note;
            }
            if (str_contains($moduleName, 'math') || str_contains($moduleName, 'stat') || str_contains($moduleName, 'inform') || str_contains($moduleName, 'quant')) {
                $categories['quantitative'][] = $note;
            }
        }

        $scores = [];
        foreach ($categories as $cat => $notes) {
            $scores[$cat] = count($notes) > 0 ? (array_sum($notes) / count($notes)) : 12.0; // Note pivot par défaut 12/20
        }

        return $scores;
    }

    /**
     * Calcule le score de compatibilité (0 à 100).
     */
    protected function computeCompatibilityScore(array $categoryScores, array $weights): float
    {
        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($weights as $cat => $weight) {
            $score = $categoryScores[$cat] ?? 12.0;
            $weightedSum += ($score / 20.0) * $weight;
            $totalWeight += $weight;
        }

        $normalized = $totalWeight > 0 ? ($weightedSum / $totalWeight) * 100 : 70;

        return min(98.5, max(45.0, $normalized + 5.0)); // Ajustement pour échelle business school
    }

    protected function getCategoryLabel(string $cat): string
    {
        return match ($cat) {
            'finance' => 'Finance & Trésorerie',
            'accounting' => 'Comptabilité & Audit',
            'marketing' => 'Marketing Stratégique',
            'commercial' => 'Négociation Commerciale',
            'management' => 'Management & Organisation',
            'communication' => 'Communication & Langues',
            'law' => 'Droit & Économie',
            'quantitative' => 'Outils Quantitatifs & Stats',
            default => ucfirst($cat),
        };
    }
}
