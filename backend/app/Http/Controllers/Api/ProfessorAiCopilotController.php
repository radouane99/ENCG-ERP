<?php

namespace App\Http\Controllers\Api;

use App\Enums\AttendanceStatus;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Group;
use App\Models\LearningMaterial;
use App\Models\Module;
use App\Models\Student;
use App\Services\AI\GeminiApiService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProfessorAiCopilotController extends Controller
{
    protected GeminiApiService $geminiApi;

    public function __construct(GeminiApiService $geminiApi)
    {
        $this->geminiApi = $geminiApi;
    }

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
                .'Barème LMD ENCG : validation ≥ 10/20, éliminatoire < 6/20 — ne propose pas de corrigé type avec une note < 6. '
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

    /**
     * Traitement et structuration par l'IA (Gemini 1.5) d'une dictée vocale de séance pour le Cahier de Texte.
     */
    public function structureVoiceTextbook(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transcription' => 'required|string|min:3',
            'module_id' => 'nullable|exists:modules,id',
            'session_type' => 'nullable|string|in:CM,TD,TP',
            'session_duration' => 'nullable|numeric',
        ]);

        $rawText = trim($validated['transcription']);
        $moduleId = $validated['module_id'] ?? null;
        $sessionType = $validated['session_type'] ?? 'CM';

        $moduleName = 'Module Universitaire ENCG';
        if ($moduleId) {
            $mod = Module::with('filiere')->find($moduleId);
            if ($mod) {
                $moduleName = "{$mod->name} ({$mod->filiere?->name})";
            }
        }

        $system = [
            "Tu es le Moteur d'IA Pédagogique de l'ENCG Fès (École Nationale de Commerce et de Gestion).",
            "Tu es chargé d'analyser la dictée vocale brute d'un enseignant universitaire après son cours pour structurer sa déclaration officielle de Cahier de Texte.",
            "Module concerné : {$moduleName} (Type : {$sessionType}).",
            "Réponds STRICTEMENT sous forme d'un objet JSON valide sans aucune balise markdown ni texte autour.",
            'Format JSON attendu : {',
            '  "title": "Intitulé professionnel court du chapitre ou de la séance",',
            '  "pedagogical_objectives": ["Objectif 1", "Objectif 2", "Objectif 3"],',
            '  "notions_covered": "Synthèse concise des notions, théories, modèles ou outils abordés",',
            '  "work_assigned": "Exercices, cas pratiques ou lectures assignés pour la séance suivante (ou \'Aucun devoir particulier\')",',
            '  "estimated_syllabus_progress": 8',
            '}',
        ];

        $prompt = "Voici la dictée vocale de l'enseignant :\n\"{$rawText}\"\n\nStructure cette séance de manière académique et professionnelle pour le système LMD de l'ENCG Fès.";

        $aiResponse = $this->geminiApi->generateContent($prompt, $system);

        if ($aiResponse) {
            $cleanJson = preg_replace('/^```json\s*|\s*```$/i', '', trim($aiResponse));
            $cleanJson = preg_replace('/^```\s*|\s*```$/i', '', trim($cleanJson));
            $parsed = json_decode($cleanJson, true);
            if (is_array($parsed) && isset($parsed['title'])) {
                return response()->json([
                    'success' => true,
                    'source' => 'gemini_ai',
                    'data' => [
                        'title' => $parsed['title'] ?? 'Séance Pédagogique',
                        'pedagogical_objectives' => is_array($parsed['pedagogical_objectives'] ?? null) ? $parsed['pedagogical_objectives'] : [
                            'Acquisition des concepts fondamentaux',
                            'Application pratique sur cas managériaux',
                        ],
                        'notions_covered' => $parsed['notions_covered'] ?? $rawText,
                        'work_assigned' => $parsed['work_assigned'] ?? 'Aucun travail particulier assigné.',
                        'estimated_syllabus_progress' => min(100, max(5, (int) ($parsed['estimated_syllabus_progress'] ?? 8))),
                    ],
                ]);
            }
        }

        // Fallback intelligent structuré
        return response()->json([
            'success' => true,
            'source' => 'heuristic_engine',
            'data' => [
                'title' => 'Séance d\'Enseignement : '.Str::limit($rawText, 50),
                'pedagogical_objectives' => [
                    'Compréhension des fondements théoriques de la séance',
                    'Résolution des exercices d\'application et études de cas',
                    'Consolidation des acquis méthodologiques',
                ],
                'notions_covered' => $rawText,
                'work_assigned' => 'Révision du chapitre et préparation des cas pratiques suivants.',
                'estimated_syllabus_progress' => 8,
            ],
        ]);
    }

    /**
     * Suggestion automatique du contenu de la séance pour le Cahier de Texte lors de l'émargement.
     */
    public function autoCompleteAttendanceTextbook(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'seance_code' => 'nullable|string|max:10',
            'session_type' => 'nullable|string|in:CM,TD,TP',
        ]);

        $module = Module::with('filiere')->findOrFail($validated['module_id']);
        $seanceCode = $validated['seance_code'] ?? 'S1';
        $sessionType = $validated['session_type'] ?? 'CM';
        $num = (int) preg_replace('/[^0-9]/', '', $seanceCode) ?: 1;

        $prompt = "Génère un intitulé de séance et un résumé concis des notions clés pour la séance {$seanceCode} du module '{$module->name}' ({$module->filiere?->name}) en {$sessionType} de l'ENCG Fès. Réponds STRICTEMENT en JSON : {\"chapter_title\": \"...\", \"key_concepts\": \"...\"}";

        $system = [
            "Tu es un expert pédagogique de l'ENCG Fès.",
            "La séance {$seanceCode} correspond approximativement à l'avancement ".(min(100, $num * 8)).'% du syllabus semestriel.',
            'Fournis un titre de chapitre réaliste et un paragraphe de notions clés.',
        ];

        $aiResponse = $this->geminiApi->generateContent($prompt, $system);

        if ($aiResponse) {
            $cleanJson = preg_replace('/^```json\s*|\s*```$/i', '', trim($aiResponse));
            $cleanJson = preg_replace('/^```\s*|\s*```$/i', '', trim($cleanJson));
            $parsed = json_decode($cleanJson, true);
            if (is_array($parsed) && ! empty($parsed['chapter_title'])) {
                return response()->json([
                    'success' => true,
                    'source' => 'gemini_ai',
                    'data' => [
                        'chapter_title' => $parsed['chapter_title'],
                        'key_concepts' => $parsed['key_concepts'] ?? "Notions abordées lors de la séance {$seanceCode} du module {$module->name}.",
                    ],
                ]);
            }
        }

        // Fallback
        return response()->json([
            'success' => true,
            'source' => 'heuristic_engine',
            'data' => [
                'chapter_title' => "Séance {$seanceCode} : Concepts Fondamentaux & Pratiques de {$module->name}",
                'key_concepts' => "Progression du syllabus officiel {$module->name}. Approfondissement des concepts clés de la séance {$seanceCode}, études de cas d'entreprises marocaines et exercices d'application.",
            ],
        ]);
    }

    /**
     * Analyse prédictive des risques d'absence et d'exclusion (Article 14 ENCG Fès).
     */
    public function analyzeAttendanceRisk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'group_id' => 'required|exists:groups,id',
            'module_id' => 'nullable|exists:modules,id',
            'sub_group' => 'nullable|string|max:20',
        ]);

        $groupId = $validated['group_id'];
        $moduleId = $validated['module_id'] ?? null;
        $subGroup = $validated['sub_group'] ?? null;

        $group = Group::with(['filiere', 'academicYear'])->findOrFail($groupId);

        // Fetch students in this group/subgroup
        $studentsQuery = Student::with('user')
            ->whereHas('pathways', function ($p) use ($groupId, $subGroup) {
                $p->where('group_id', $groupId)->where('is_current', true);
                if (! empty($subGroup)) {
                    $p->where('sub_group', $subGroup);
                }
            })
            ->join('users', 'students.user_id', '=', 'users.id')
            ->orderBy('users.last_name', 'asc')
            ->orderBy('users.first_name', 'asc')
            ->select('students.*');

        $students = $studentsQuery->get();

        // Fetch attendance sessions for this group/module
        $sessionsQuery = AttendanceSession::where('group_id', $groupId);
        if ($moduleId) {
            $sessionsQuery->where('module_id', $moduleId);
        }
        if (! empty($subGroup)) {
            $sessionsQuery->where(function ($q) use ($subGroup) {
                $q->where('sub_group', $subGroup)->orWhereNull('sub_group');
            });
        }
        $sessions = $sessionsQuery->orderBy('session_date', 'asc')->get();
        $totalSessionsCount = max(1, $sessions->count());

        $sessionIds = $sessions->pluck('id');
        $allAttendances = Attendance::whereIn('attendance_session_id', $sessionIds)->get()->groupBy('student_id');

        $criticalStudents = []; // >= 3 absences non justifiées (Art. 14)
        $warningStudents = [];  // 2 absences (Zone de vigilance)
        $totalAbsencesRecorded = 0;

        foreach ($students as $s) {
            $records = $allAttendances->get($s->id, collect());
            $unexcusedAbsences = 0;
            $excusedAbsences = 0;

            foreach ($records as $r) {
                if ($r->status === AttendanceStatus::ABSENT || (is_string($r->status) && $r->status === 'absent')) {
                    if ($r->is_justified) {
                        $excusedAbsences++;
                    } else {
                        $unexcusedAbsences++;
                        $totalAbsencesRecorded++;
                    }
                }
            }

            $studentData = [
                'id' => $s->id,
                'name' => trim(($s->user?->first_name ?? '').' '.($s->user?->last_name ?? '')),
                'matricule' => $s->student_number ?? 'N/A',
                'cne' => $s->cne ?: ($s->massar_code ?: '—'),
                'unexcused_absences' => $unexcusedAbsences,
                'excused_absences' => $excusedAbsences,
                'total_absences' => $unexcusedAbsences + $excusedAbsences,
                'attendance_rate' => round(max(0, (1 - ($unexcusedAbsences / $totalSessionsCount))) * 100, 1),
            ];

            if ($unexcusedAbsences >= 3) {
                $studentData['risk_level'] = 'CRITICAL';
                $studentData['legal_status'] = 'Risque d\'exclusion examen (Art. 14 ENCG Fès)';
                $criticalStudents[] = $studentData;
            } elseif ($unexcusedAbsences >= 2) {
                $studentData['risk_level'] = 'WARNING';
                $studentData['legal_status'] = 'Zone d\'alerte assiduité (Avertissement)';
                $warningStudents[] = $studentData;
            }
        }

        $globalAttendanceRate = round(max(0, (1 - ($totalAbsencesRecorded / max(1, count($students) * $totalSessionsCount)))) * 100, 1);

        $aiSummary = "Taux de présence global de la classe : {$globalAttendanceRate}%. "
            .count($criticalStudents)." étudiant(s) ont atteint le seuil critique de 3 absences non justifiées et sont exposés à l'élimination aux examens selon le règlement des études ENCG Fès. "
            .count($warningStudents)." étudiant(s) sont en zone d'alerte (2 absences).";

        $recommendations = [
            'Transmettre la liste des étudiants en risque critique au service de la scolarité pour convocation officielle.',
            'Vérifier auprès des délégués si des certificats médicaux sont en attente de visa dans les 48h réglementaires.',
            'Sensibiliser la classe lors de la prochaine séance sur l\'obligation d\'assiduité aux Travaux Dirigés.',
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'group_name' => $group->name,
                'total_students' => count($students),
                'total_sessions_evaluated' => $totalSessionsCount,
                'global_attendance_rate' => $globalAttendanceRate,
                'critical_count' => count($criticalStudents),
                'warning_count' => count($warningStudents),
                'critical_students' => $criticalStudents,
                'warning_students' => $warningStudents,
                'ai_summary' => $aiSummary,
                'ai_recommendations' => $recommendations,
            ],
        ]);
    }

    /**
     * Téléchargement d'un sujet d'examen officiel généré par l'IA au format PDF A4.
     */
    public function downloadExamPaperPdf(Request $request)
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'title' => 'required|string',
            'context' => 'nullable|string',
            'sections' => 'required|array',
            'rubric' => 'nullable|array',
            'total_points' => 'nullable|numeric',
            'duration' => 'nullable|string',
            'include_corrige' => 'nullable|boolean',
        ]);

        $module = Module::with(['filiere', 'academicYear'])->findOrFail($validated['module_id']);
        $user = $request->user();
        $professorName = $user ? trim(($user->first_name ?? '').' '.($user->last_name ?? '')) : 'Professeur ENCG';

        $trackingCode = 'EXAM-'.date('Y').'-'.str_pad($module->id, 4, '0', STR_PAD_LEFT);
        $securityHash = hash('sha256', $module->id.'_'.date('YmdHis').'_'.($user?->id ?? 0));

        $pdf = Pdf::loadView('pdf.epreuve_examen_officiel', [
            'moduleName' => $module->name,
            'filiereName' => $module->filiere?->name ?? 'Gestion & Commerce',
            'semester' => $module->semester ?? 1,
            'academicYear' => date('Y').'/'.(date('Y') + 1),
            'professorName' => $professorName,
            'duration' => $validated['duration'] ?? '2 Heures',
            'totalPoints' => $validated['total_points'] ?? 20,
            'title' => $validated['title'],
            'context' => $validated['context'] ?? '',
            'sections' => $validated['sections'],
            'rubric' => $validated['rubric'] ?? [],
            'includeCorrigé' => $validated['include_corrige'] ?? false,
            'trackingCode' => $trackingCode,
            'securityHash' => $securityHash,
        ])->setPaper('a4', 'portrait');

        $cleanTitle = Str::slug($module->name);

        return $pdf->stream("Epreuve_Examen_{$cleanTitle}.pdf", ['Attachment' => false]);
    }
}
