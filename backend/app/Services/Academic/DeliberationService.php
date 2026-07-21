<?php

namespace App\Services\Academic;

use App\Models\ExamSession;
use App\Models\Module;
use Illuminate\Support\Facades\DB;

class DeliberationService
{
    /**
     * Calcule les moyennes de tous les étudiants pour un module donné
     * et alimente la table resit_eligibilities si la note est entre 5 et 10.
     * Règle ENCG :
     * - Note >= 10 : Validé
     * - 5 <= Note < 10 : Rattrapage (Éligible)
     * - Note < 5 : Non Validé (Note éliminatoire)
     *
     * @param int $moduleId
     * @param int|null $examSessionId (L'ID de la session normale en cours, optionnel pour l'instant)
     * @return array Résumé du traitement
     */
    public function processModuleDeliberation(int $moduleId, ?int $examSessionId = null): array
    {
        $module = Module::with('assessments')->findOrFail($moduleId);
        
        if ($module->assessments->isEmpty()) {
            return ['status' => 'error', 'message' => 'Ce module n\'a aucune évaluation définie.'];
        }

        // On vérifie qu'il n'y a pas d'évaluation de type "Rattrapage" parmi les évaluations normales pour ce calcul
        $normalAssessments = $module->assessments->filter(fn($a) => strtolower($a->type) !== 'rattrapage');

        $assessmentIds = $normalAssessments->pluck('id')->toArray();
        if (empty($assessmentIds)) {
            return ['status' => 'error', 'message' => 'Aucune évaluation de session normale trouvée.'];
        }

        // Récupérer toutes les notes pour ces évaluations
        $grades = DB::table('grades')
            ->whereIn('assessment_id', $assessmentIds)
            ->get();

        // Grouper par étudiant
        $studentGrades = $grades->groupBy('student_id');

        $validated = 0;
        $rattrapage = 0;
        $failed = 0;

        if ($examSessionId) {
            $sessionId = $examSessionId;
        } else {
            $sessionId = ExamSession::where('is_active', true)->value('id');
        }

        if (!$sessionId) {
            throw new \InvalidArgumentException('A valid active exam session ID must be provided.');
        }

        foreach ($studentGrades as $studentId => $studentGradeRecords) {
            $finalScore = 0;
            $hasAbsent = false;

            foreach ($normalAssessments as $assessment) {
                // Trouver la note de cet étudiant pour cette évaluation
                $record = $studentGradeRecords->firstWhere('assessment_id', $assessment->id);
                
                if (!$record || $record->absent) {
                    $hasAbsent = true; // S'il est absent à une des éval, il est considéré absent au module
                } else {
                    // Calcul de la moyenne pondérée
                    $finalScore += ($record->value * ($assessment->weight / 100));
                }
            }

            // Détermination du statut
            if ($hasAbsent || $finalScore < 5) {
                // Note éliminatoire ou absent = Non Validé (Ajourné, pas de rattrapage direct parfois, mais selon la norme ENCG, < 5 = Non validé)
                $failed++;
                
                // Va directement en Dettes (Retape l'année prochaine)
                DB::table('student_module_retakes')->updateOrInsert(
                    [
                        'student_id' => $studentId,
                        'module_id' => $moduleId,
                        'academic_year_id' => $sessionId // Using session ID or current active year ID
                    ],
                    [
                        'status' => 'pending',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            } elseif ($finalScore >= 10) {
                // Validé
                $validated++;
                
                // Archive définitive dans module_validations
                DB::table('module_validations')->updateOrInsert(
                    [
                        'student_id' => $studentId,
                        'module_id' => $moduleId
                    ],
                    [
                        'final_grade' => $finalScore,
                        'validated_at_session_id' => $sessionId,
                        'status' => 'validated',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
                
                // Si l'étudiant avait ce module en dette, on le marque comme réussi
                DB::table('student_module_retakes')
                    ->where('student_id', $studentId)
                    ->where('module_id', $moduleId)
                    ->where('status', 'pending')
                    ->update(['status' => 'passed', 'updated_at' => now()]);

            } else {
                // Entre 5 et 9.99 : Rattrapage
                $rattrapage++;
                
                // Insérer dans la table resit_eligibilities
                DB::table('resit_eligibilities')->updateOrInsert(
                    [
                        'student_id' => $studentId,
                        'module_id' => $moduleId,
                        'exam_session_id' => $sessionId
                    ],
                    [
                        'is_eligible' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        return [
            'status' => 'success',
            'validated' => $validated,
            'rattrapage' => $rattrapage,
            'failed' => $failed,
            'total_processed' => $studentGrades->count()
        ];
    }

    /**
     * Génère le PV global (Bilan des notes) pour un étudiant pour une année donnée.
     * Cette méthode fusionne les notes historiques (modules déjà validés les années précédentes)
     * et les notes actuelles (modules de l'année en cours + modules repassés).
     */
    public function generateGlobalPV(int $studentId, int $academicYearId): array
    {
        // 1. Récupérer les inscriptions de l'étudiant pour cette année (student_pathways)
        // Pour faire simple, on va chercher tous les modules du semestre actuel de l'étudiant
        $currentPathway = DB::table('student_pathways')
            ->where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->latest('id')
            ->first();

        $modulesToAssess = collect();
        
        if ($currentPathway) {
            // Ajouter les modules du semestre actuel
            $semesterModules = DB::table('modules')
                ->where('filiere_id', $currentPathway->filiere_id)
                ->where('semester_number', $currentPathway->semester_number)
                ->get();
            $modulesToAssess = $modulesToAssess->merge($semesterModules);
        }

        // 2. Récupérer les "Dettes" / Retakes de l'étudiant pour cette année
        $retakeModuleIds = DB::table('student_module_retakes')
            ->where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->pluck('module_id');

        if ($retakeModuleIds->isNotEmpty()) {
            $retakeModules = DB::table('modules')->whereIn('id', $retakeModuleIds)->get();
            $modulesToAssess = $modulesToAssess->merge($retakeModules);
        }

        // 3. Récupérer les notes validées historiquement
        $historicalValidations = DB::table('module_validations')
            ->where('student_id', $studentId)
            ->get()
            ->keyBy('module_id');

        $pv = [];
        $totalScore = 0;
        $totalCoef = 0;

        foreach ($modulesToAssess->unique('id') as $module) {
            $record = [
                'module_id' => $module->id,
                'module_name' => $module->name,
                'semester' => $module->semester_number,
                'coefficient' => $module->coefficient ?? 1,
                'grade' => null,
                'status' => 'pending', // pending, validated, failed
                'is_retake' => $retakeModuleIds->contains($module->id),
                'is_historical' => false,
            ];

            // A-t-il déjà validé ce module historiquement ?
            if ($historicalValidations->has($module->id) && !$record['is_retake']) {
                $record['grade'] = $historicalValidations->get($module->id)->final_grade;
                $record['status'] = 'validated';
                $record['is_historical'] = true;
            } else {
                // Sinon, on calcule la note actuelle (très simplifié ici, normalement on fait la moyenne pondérée des grades)
                // Pour l'exemple, on cherche juste s'il a une note validée cette année (car on vient de la calculer)
                // ou on calcule à la volée
                $currentGradeRaw = DB::table('grades')
                    ->join('assessments', 'grades.assessment_id', '=', 'assessments.id')
                    ->where('grades.student_id', $studentId)
                    ->where('assessments.module_id', $module->id)
                    ->select(DB::raw('SUM(grades.value * (assessments.weight / 100)) as final_score'))
                    ->first();

                if ($currentGradeRaw && $currentGradeRaw->final_score !== null) {
                    $record['grade'] = round($currentGradeRaw->final_score, 2);
                    $record['status'] = $record['grade'] >= 10 ? 'validated' : 'failed';
                }
            }

            if ($record['grade'] !== null) {
                $totalScore += ($record['grade'] * $record['coefficient']);
                $totalCoef += $record['coefficient'];
            }

            $pv[] = $record;
        }

        $globalAverage = $totalCoef > 0 ? round($totalScore / $totalCoef, 2) : null;

        return [
            'student_id' => $studentId,
            'academic_year_id' => $academicYearId,
            'modules' => $pv,
            'global_average' => $globalAverage,
            'global_status' => $globalAverage >= 10 ? 'passed' : 'failed'
        ];
    }
}
