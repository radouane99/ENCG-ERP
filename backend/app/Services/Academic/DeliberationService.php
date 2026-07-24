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

    /**
     * Génère le PV d'un semestre en intégrant les étudiants résidants/réguliers ET les étudiants RÉSERVISTES (avec Dettes)
     * fusionnant leurs notes antérieurement validées (ex: 2024-2025) et les notes validées cette année.
     */
    public function getSemesterPVWithReservistes(int $filiereId, int $academicYearId, int $semesterNumber): array
    {
        $modules = DB::table('modules')
            ->where('filiere_id', $filiereId)
            ->where('semester_number', $semesterNumber)
            ->get();

        $moduleIds = $modules->pluck('id')->toArray();

        // 1. Étudiants inscrits normalement dans ce semestre
        $regularStudentIds = DB::table('student_registrations')
            ->where('filiere_id', $filiereId)
            ->where('academic_year_id', $academicYearId)
            ->where('semester_number', $semesterNumber)
            ->pluck('student_id')
            ->toArray();

        // 2. Étudiants RÉSERVISTES (qui repassent un module en dette dans ce semestre)
        $reservisteStudentIds = DB::table('student_module_retakes')
            ->whereIn('module_id', $moduleIds)
            ->where('academic_year_id', $academicYearId)
            ->pluck('student_id')
            ->toArray();

        $allStudentIds = array_unique(array_merge($regularStudentIds, $reservisteStudentIds));

        $students = DB::table('students')
            ->whereIn('id', $allStudentIds)
            ->orderBy('last_name')
            ->get();

        $matrix = [];

        foreach ($students as $student) {
            $isReserviste = !in_array($student->id, $regularStudentIds);

            // Fetch historical validations for this student
            $historical = DB::table('module_validations')
                ->where('student_id', $student->id)
                ->whereIn('module_id', $moduleIds)
                ->get()
                ->keyBy('module_id');

            // Fetch current grades for this student
            $currentGrades = DB::table('grades')
                ->join('assessments', 'grades.assessment_id', '=', 'assessments.id')
                ->where('grades.student_id', $student->id)
                ->whereIn('assessments.module_id', $moduleIds)
                ->select(
                    'assessments.module_id',
                    'assessments.type',
                    'assessments.weight',
                    'grades.value',
                    'grades.absent'
                )
                ->get()
                ->groupBy('module_id');

            $moduleResults = [];
            $totalScore = 0;
            $totalCoef = 0;
            $hasEliminatory = false;
            $hasPending = false;

            foreach ($modules as $module) {
                $coef = $module->coefficient ?? 1.0;
                $totalCoef += $coef;

                // Priority 1: Has historical validation from previous years
                if ($historical->has($module->id)) {
                    $histVal = $historical->get($module->id);
                    $gradeVal = round($histVal->final_grade, 2);
                    $moduleResults[$module->id] = [
                        'grade' => $gradeVal,
                        'formatted' => number_format($gradeVal, 2) . ' (V.Anté)',
                        'status' => 'V.Anté',
                        'is_historical' => true,
                    ];
                    $totalScore += ($gradeVal * $coef);
                } 
                // Priority 2: Evaluated in current academic year
                elseif ($currentGrades->has($module->id)) {
                    $mGrades = $currentGrades->get($module->id);
                    $normalAssessments = $mGrades->filter(fn($g) => strtolower($g->type) !== 'rattrapage');
                    $rattrapageAssessment = $mGrades->firstWhere(fn($g) => strtolower($g->type) === 'rattrapage');

                    $score = 0;
                    $absent = false;

                    foreach ($normalAssessments as $g) {
                        if ($g->absent) {
                            $absent = true;
                        } else {
                            $score += ($g->value * ($g->weight / 100));
                        }
                    }

                    // Check rattrapage if eligible
                    if ($rattrapageAssessment && !$rattrapageAssessment->absent && $rattrapageAssessment->value !== null) {
                        if ($rattrapageAssessment->value > $score) {
                            $score = $rattrapageAssessment->value; // Take higher grade
                        }
                    }

                    $score = round($score, 2);

                    if ($absent || $score < 5.0) {
                        $hasEliminatory = true;
                    }

                    $status = ($score >= 10.0) ? 'V' : (($score >= 5.0) ? 'RAT' : 'NV');

                    $moduleResults[$module->id] = [
                        'grade' => $score,
                        'formatted' => number_format($score, 2),
                        'status' => $status,
                        'is_historical' => false,
                    ];

                    $totalScore += ($score * $coef);
                } 
                else {
                    $hasPending = true;
                    $moduleResults[$module->id] = [
                        'grade' => null,
                        'formatted' => '–',
                        'status' => 'PENDING',
                        'is_historical' => false,
                    ];
                }
            }

            $semesterAvg = $totalCoef > 0 ? round($totalScore / $totalCoef, 2) : 0;

            if ($semesterAvg >= 10.0 && !$hasEliminatory) {
                $decision = 'V';
            } elseif ($semesterAvg >= 5.0) {
                $decision = 'RAT';
            } else {
                $decision = 'AJ';
            }

            $matrix[] = [
                'student_id' => $student->id,
                'student' => mb_strtoupper($student->last_name) . ' ' . $student->first_name,
                'cne' => $student->cne_cme ?? $student->student_number,
                'is_reserviste' => $isReserviste,
                'semester_average' => $semesterAvg,
                'decision' => $decision,
                'modules' => $moduleResults,
            ];
        }

        return [
            'modules' => $modules,
            'matrix' => $matrix,
        ];
    }

    /**
     * Compose automatiquement la commission du jury (7 professeurs pour un semestre, 14 pour l'année + Chef de filière)
     */
    public function autoComposeJury(int $filiereId, int $academicYearId, ?int $semesterNumber = null, string $type = 'semestriel'): array
    {
        $query = DB::table('modules')
            ->where('filiere_id', $filiereId)
            ->where('is_active', true);

        if ($type === 'semestriel' && $semesterNumber) {
            $query->where('semester_number', $semesterNumber);
        }

        $modules = $query->get();

        $juryMembers = [];
        $addedUserIds = [];

        foreach ($modules as $module) {
            // Find professor assigned to this module
            $profRecord = DB::table('module_professor')
                ->join('professors', 'module_professor.professor_id', '=', 'professors.id')
                ->join('users', 'professors.user_id', '=', 'users.id')
                ->where('module_id', $module->id)
                ->select('users.id as user_id', 'users.name as user_name', 'users.email')
                ->first();

            $userId = $profRecord ? $profRecord->user_id : null;
            $userName = $profRecord ? ($profRecord->user_name ?? $profRecord->email) : "Non assigné ({$module->name})";

            $existing = DB::table('deliberation_juries')
                ->where('filiere_id', $filiereId)
                ->where('academic_year_id', $academicYearId)
                ->where('type', $type)
                ->where('module_id', $module->id)
                ->when($semesterNumber, fn($q) => $q->where('semester_number', $semesterNumber))
                ->first();

            if (!$existing) {
                $id = DB::table('deliberation_juries')->insertGetId([
                    'filiere_id' => $filiereId,
                    'academic_year_id' => $academicYearId,
                    'semester_number' => $semesterNumber,
                    'type' => $type,
                    'user_id' => $userId,
                    'module_id' => $module->id,
                    'user_name' => $userName,
                    'role' => 'professeur',
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $id = $existing->id;
            }

            if ($userId) $addedUserIds[] = $userId;

            $juryMembers[] = [
                'id' => $id,
                'module_id' => $module->id,
                'module_name' => $module->name,
                'module_code' => $module->code,
                'user_id' => $userId,
                'user_name' => $userName,
                'role' => 'professeur',
                'status' => $existing->status ?? 'pending',
                'signed_at' => $existing->signed_at ?? null,
                'digital_seal' => $existing->digital_seal ?? null,
            ];
        }

        // Add Chef de Filière / Président du jury if not already present
        $filiereObj = DB::table('filieres')->where('id', $filiereId)->first();
        $chefFiliereUser = \App\Models\User::whereIn('role', ['admin', 'professor'])->first();

        $chefUserId = $chefFiliereUser ? $chefFiliereUser->id : null;
        $chefName = $chefFiliereUser ? $chefFiliereUser->name : ($filiereObj ? "Président du Jury ({$filiereObj->code})" : 'Chef de Filière');

        $existingChef = DB::table('deliberation_juries')
            ->where('filiere_id', $filiereId)
            ->where('academic_year_id', $academicYearId)
            ->where('type', $type)
            ->where('role', 'chef_filiere')
            ->when($semesterNumber, fn($q) => $q->where('semester_number', $semesterNumber))
            ->first();

        if (!$existingChef) {
            $chefId = DB::table('deliberation_juries')->insertGetId([
                'filiere_id' => $filiereId,
                'academic_year_id' => $academicYearId,
                'semester_number' => $semesterNumber,
                'type' => $type,
                'user_id' => $chefUserId,
                'user_name' => $chefName,
                'role' => 'chef_filiere',
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $chefId = $existingChef->id;
        }

        $juryMembers[] = [
            'id' => $chefId,
            'module_id' => null,
            'module_name' => 'Coordination Globale',
            'module_code' => 'CHEF',
            'user_id' => $chefUserId,
            'user_name' => $chefName,
            'role' => 'chef_filiere',
            'status' => $existingChef->status ?? 'pending',
            'signed_at' => $existingChef->signed_at ?? null,
            'digital_seal' => $existingChef->digital_seal ?? null,
        ];

        return $juryMembers;
    }

    /**
     * Signe le PV de délibération par un membre du jury
     */
    public function signJuryPv(int $juryId, int $userId, string $signatureData, string $ipAddress): array
    {
        $jury = DB::table('deliberation_juries')->where('id', $juryId)->first();
        if (!$jury) {
            return ['status' => 'error', 'message' => 'Membre du jury introuvable.'];
        }

        $digitalSeal = hash('sha256', json_encode([
            'jury_id' => $juryId,
            'user_id' => $userId,
            'filiere_id' => $jury->filiere_id,
            'signed_at' => now()->toIso8601String(),
            'ip' => $ipAddress,
        ]));

        DB::table('deliberation_juries')
            ->where('id', $juryId)
            ->update([
                'status' => 'signed',
                'signed_at' => now(),
                'signature_data' => $signatureData,
                'digital_seal' => $digitalSeal,
                'ip_address' => $ipAddress,
                'updated_at' => now(),
            ]);

        return [
            'status' => 'success',
            'digital_seal' => $digitalSeal,
            'signed_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Calcule la compensation annuelle globale (S1+S2, S3+S4, etc.)
     */
    public function calculateAnnualCompensation(int $filiereId, int $academicYearId): array
    {
        $students = DB::table('students')
            ->whereHas('registrations', fn($q) => $q->where('filiere_id', $filiereId)->where('academic_year_id', $academicYearId))
            ->get();

        $results = [];

        foreach ($students as $student) {
            // Fetch validated grades
            $validations = DB::table('module_validations')
                ->join('modules', 'module_validations.module_id', '=', 'modules.id')
                ->where('module_validations.student_id', $student->id)
                ->where('modules.filiere_id', $filiereId)
                ->select('modules.semester_number', 'modules.coefficient', 'module_validations.final_grade')
                ->get();

            $oddGrades = $validations->filter(fn($v) => $v->semester_number % 2 !== 0);
            $evenGrades = $validations->filter(fn($v) => $v->semester_number % 2 === 0);

            $oddAvg = $oddGrades->avg('final_grade') ?? 0;
            $evenAvg = $evenGrades->avg('final_grade') ?? 0;
            $annualAvg = round(($oddAvg + $evenAvg) / 2, 2);

            $hasEliminatory = $validations->pluck('final_grade')->contains(fn($g) => $g < 5.0);

            if ($oddAvg >= 10.0 && $evenAvg >= 10.0) {
                $decision = 'V'; // Validé
            } elseif ($annualAvg >= 10.0 && !$hasEliminatory) {
                $decision = 'V.Comp'; // Validé par compensation
            } elseif ($annualAvg < 10.0 && $annualAvg >= 5.0) {
                $decision = 'R'; // Rattrapage
            } else {
                $decision = 'AJ'; // Ajourné / Redoublant
            }

            $results[] = [
                'student_id' => $student->id,
                'student_name' => $student->first_name . ' ' . $student->last_name,
                'cne' => $student->cne_cme ?? $student->student_number,
                'odd_semester_avg' => round($oddAvg, 2),
                'even_semester_avg' => round($evenAvg, 2),
                'annual_average' => $annualAvg,
                'decision' => $decision,
            ];
        }

        return $results;
    }
}

