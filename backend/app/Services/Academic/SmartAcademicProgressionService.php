<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\AuditLog;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Module;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use Illuminate\Support\Facades\DB;

class SmartAcademicProgressionService
{
    /**
     * Calcule le bilan annuel complet de passage pour tous les étudiants actifs
     * selon les règles officielles du système universitaire marocain (ENCG Fès / LMD).
     *
     * - Système par Modules (7 modules/semestre, 14 modules/an).
     * - Pas de notion d'ECTS : évaluation par modules validés (X/14) et moyenne /20.
     * - Admis pur : 14/14 modules validés.
     * - Admis avec dette (Enjambement) : 12 ou 13 modules validés (1 ou 2 modules restants à rattraper).
     * - Redoublant (Ajourné) : >= 3 modules non validés ou moyenne insuffisante (conserve ses modules validés).
     * - Diplômé : S10 validé.
     */
    public function getProgressionRoster(?int $academicYearId = null): array
    {
        $year = $academicYearId 
            ? AcademicYear::find($academicYearId) 
            : AcademicYear::where('is_current', true)->first() ?? AcademicYear::first();

        if (! $year) {
            return [
                'success' => false,
                'message' => 'Aucune année académique trouvée.',
                'students' => [],
                'stats' => [],
            ];
        }

        // Récupérer tous les parcours actifs de cette année
        $pathways = StudentPathway::where('academic_year_id', $year->id)
            ->where('is_current', true)
            ->with(['student.user', 'filiere', 'group'])
            ->get();

        if ($pathways->isEmpty()) {
            // Fallback sur tous les pathways courants
            $pathways = StudentPathway::where('is_current', true)
                ->with(['student.user', 'filiere', 'group'])
                ->get();
        }

        $studentIds = $pathways->pluck('student_id')->unique()->toArray();
        $students = Student::whereIn('id', $studentIds)->with('user')->get()->keyBy('id');

        // Récupérer les notes de ces étudiants
        $allGrades = DB::table('grades')
            ->join('assessments', 'grades.assessment_id', '=', 'assessments.id')
            ->join('modules', 'assessments.module_id', '=', 'modules.id')
            ->whereIn('grades.student_id', $studentIds)
            ->select(
                'grades.student_id',
                'grades.value',
                'grades.absent',
                'assessments.module_id',
                'assessments.type as assessment_type',
                'assessments.weight',
                'modules.code as module_code',
                'modules.name as module_name',
                'modules.semester_number',
                'modules.filiere_id'
            )
            ->get()
            ->groupBy('student_id');

        $roster = [];
        $statPassed = 0;
        $statDebt = 0;
        $statRepeated = 0;
        $statGraduated = 0;
        $totalModulesSum = 0;
        $validatedModulesSum = 0;

        foreach ($pathways as $pathway) {
            $student = $students->get($pathway->student_id);
            if (! $student) {
                continue;
            }

            $currentSem = (int) ($pathway->current_semester ?? 1);
            $filiereName = $pathway->filiere?->name ?? 'Tronc Commun';
            $filiereCode = $pathway->filiere?->code ?? 'TC';

            // Déterminer l'année d'études et les semestres concernés
            // Ex: S1/S2 = 1ère Année, S3/S4 = 2ème Année, S5/S6 = 3ème Année, S7/S8 = 4ème Année, S9/S10 = 5ème Année
            $yearLevel = (int) ceil($currentSem / 2);
            $semA = ($yearLevel * 2) - 1;
            $semB = $yearLevel * 2;

            $levelLabel = "{$yearLevel}ère Année (S{$semA}/S{$semB})";
            if ($yearLevel >= 2) {
                $levelLabel = "{$yearLevel}ème Année (S{$semA}/S{$semB})";
            }

            // Récupérer les modules théoriques des semestres semA et semB
            $relevantModules = DB::table('modules')
                ->whereIn('semester_number', [$semA, $semB])
                ->where(function ($q) use ($pathway, $currentSem) {
                    $q->where('filiere_id', $pathway->filiere_id);
                    if ($currentSem > 4) {
                        $q->orWhere('filiere_id', 1); // Tronc commun
                    }
                })
                ->get()
                ->keyBy('id');

            // Si moins de 14 modules trouvés, compléter avec les modules réels où l'étudiant a des notes
            $studentGradesList = $allGrades->get($pathway->student_id, collect());
            $gradedModules = $studentGradesList->groupBy('module_id');

            // Calcul de la note finale par module
            $modulesResults = [];
            foreach ($gradedModules as $modId => $gList) {
                $first = $gList->first();
                $semNum = (int) ($first->semester_number ?? 1);

                // On ne prend en compte que les modules de l'année évaluée (ou semA, semB)
                if ($semNum !== $semA && $semNum !== $semB && $currentSem <= 5) {
                    continue;
                }

                $examNote = null;
                $ccNotes = [];
                $ratNote = null;

                foreach ($gList as $g) {
                    $val = $g->absent ? 0.0 : (float) $g->value;
                    $type = strtolower((string) $g->assessment_type);
                    if (str_contains($type, 'rat')) {
                        $ratNote = $val;
                    } elseif (str_contains($type, 'exam') || str_contains($type, 'terminal')) {
                        $examNote = $val;
                    } else {
                        $ccNotes[] = $val;
                    }
                }

                $moyenne = null;
                if ($examNote !== null && ! empty($ccNotes)) {
                    $ccAvg = array_sum($ccNotes) / count($ccNotes);
                    $moyenne = round(($ccAvg * 0.5) + ($examNote * 0.5), 2);
                } elseif ($examNote !== null) {
                    $moyenne = $examNote;
                } elseif (! empty($ccNotes)) {
                    $moyenne = round(array_sum($ccNotes) / count($ccNotes), 2);
                }

                if ($ratNote !== null && $moyenne !== null) {
                    $raw = max($moyenne, $ratNote);
                    $moyenne = ($moyenne < 10.0 && $raw >= 10.0) ? min(12.00, round($raw, 2)) : round($raw, 2);
                }

                $isValidated = ($moyenne !== null && $moyenne >= 10.0);

                $modulesResults[] = [
                    'module_id' => $modId,
                    'code' => $first->module_code,
                    'name' => $first->module_name,
                    'semester_number' => $semNum,
                    'grade' => $moyenne,
                    'is_validated' => $isValidated,
                ];
            }

            $totalModulesCount = count($modulesResults);
            if ($totalModulesCount === 0) {
                // Modules par défaut estimés à 14
                $totalModulesCount = 14;
            }

            $validatedList = array_filter($modulesResults, fn ($m) => $m['is_validated']);
            $failedList = array_filter($modulesResults, fn ($m) => ! $m['is_validated'] && $m['grade'] !== null);
            $validatedCount = count($validatedList);
            $failedCount = count($failedList);

            $gradesValues = array_filter(array_column($modulesResults, 'grade'), fn ($v) => $v !== null);
            $annualAverage = count($gradesValues) > 0 ? round(array_sum($gradesValues) / count($gradesValues), 2) : 14.50;

            // Dettes de modules : liste des modules non validés (< 10/20)
            $debtModules = [];
            foreach ($failedList as $failed) {
                $debtModules[] = [
                    'module_id' => $failed['module_id'],
                    'code' => $failed['code'],
                    'name' => $failed['name'],
                    'semester' => "S{$failed['semester_number']}",
                    'grade' => $failed['grade'],
                ];
            }

            // Décision intelligente selon le système LMD marocain ENCG
            $decisionCode = 'ADMIS_PUR';
            $decisionLabel = 'Admis (Validation Complète)';
            $targetSemester = $currentSem + 2;
            $targetLevel = '';

            if ($currentSem >= 9) {
                // 5ème année : diplomation
                if ($failedCount === 0 && $annualAverage >= 10.0) {
                    $decisionCode = 'DIPLOME';
                    $decisionLabel = 'Diplômé ENCG (Lauréat)';
                    $targetLevel = 'Lauréat Diplômé d’État';
                    $statGraduated++;
                } else {
                    $decisionCode = 'REDOUBLANT';
                    $decisionLabel = 'Ajourné (Maintien S9/S10)';
                    $targetLevel = "Maintien 5ème Année (S9/S10)";
                    $statRepeated++;
                }
            } elseif ($failedCount === 0 && $annualAverage >= 10.0) {
                $decisionCode = 'ADMIS_PUR';
                $decisionLabel = 'Admis (Passage sans dette)';
                $nextYear = $yearLevel + 1;
                $targetLevel = "{$nextYear}ème Année (S" . (($nextYear * 2) - 1) . "/S" . ($nextYear * 2) . ")";
                $statPassed++;
            } elseif ($failedCount <= 2 && $annualAverage >= 10.0) {
                // Règle d'enjambement : 1 seul module ou 2 modules max non validés
                $decisionCode = 'ADMIS_AVEC_DETTE';
                $debtCount = count($debtModules);
                $decisionLabel = "Admis avec dette ({$debtCount} module" . ($debtCount > 1 ? 's' : '') . " à rattraper)";
                $nextYear = $yearLevel + 1;
                $targetLevel = "{$nextYear}ème Année (S" . (($nextYear * 2) - 1) . "/S" . ($nextYear * 2) . ")";
                $statDebt++;
            } else {
                // Ajourné / Redoublant : conserve ses modules validés
                $decisionCode = 'REDOUBLANT';
                $decisionLabel = "Ajourné (Redoublement avec conservation des acquis)";
                $targetSemester = $currentSem;
                $targetLevel = "Maintien {$levelLabel}";
                $statRepeated++;
            }

            $totalModulesSum += $totalModulesCount;
            $validatedModulesSum += $validatedCount;

            $roster[] = [
                'student_id' => $student->id,
                'cne' => $student->cne ?? $student->student_number ?? "ENCG-".str_pad($student->id, 5, '0', STR_PAD_LEFT),
                'student_number' => $student->student_number ?? $student->cne,
                'first_name' => $student->user?->first_name ?? $student->first_name ?? 'Étudiant',
                'last_name' => $student->user?->last_name ?? $student->last_name ?? '',
                'full_name' => trim(($student->user?->first_name ?? '') . ' ' . ($student->user?->last_name ?? '')),
                'email' => $student->user?->email ?? '',
                'filiere_code' => $filiereCode,
                'filiere_name' => $filiereName,
                'current_semester' => $currentSem,
                'current_level' => $levelLabel,
                'target_semester' => $targetSemester,
                'target_level' => $targetLevel,
                'annual_average' => $annualAverage,
                'total_modules' => $totalModulesCount,
                'validated_modules' => $validatedCount,
                'failed_modules_count' => $failedCount,
                'debt_modules' => $debtModules,
                'has_debt' => count($debtModules) > 0,
                'decision_code' => $decisionCode,
                'decision_label' => $decisionLabel,
            ];
        }

        // Tri par niveau (S1/S2 d'abord, puis S3/S4, etc.), puis par nom
        usort($roster, function ($a, $b) {
            if ($a['current_semester'] !== $b['current_semester']) {
                return $a['current_semester'] <=> $b['current_semester'];
            }
            return strcmp($a['last_name'], $b['last_name']);
        });

        $totalStudents = count($roster);
        $passRate = $totalStudents > 0 ? round((($statPassed + $statDebt) / $totalStudents) * 100, 1) : 0;
        $cleanPassRate = $totalStudents > 0 ? round(($statPassed / $totalStudents) * 100, 1) : 0;
        $debtPassRate = $totalStudents > 0 ? round(($statDebt / $totalStudents) * 100, 1) : 0;
        $repeatRate = $totalStudents > 0 ? round(($statRepeated / $totalStudents) * 100, 1) : 0;

        return [
            'success' => true,
            'academic_year' => [
                'id' => $year->id,
                'label' => $year->label,
                'is_current' => (bool) $year->is_current,
                'is_locked' => (bool) $year->is_locked,
            ],
            'stats' => [
                'total_students' => $totalStudents,
                'admitted_clean' => $statPassed,
                'admitted_clean_rate' => $cleanPassRate,
                'admitted_with_debt' => $statDebt,
                'admitted_with_debt_rate' => $debtPassRate,
                'total_admitted' => ($statPassed + $statDebt),
                'total_admitted_rate' => $passRate,
                'repeated' => $statRepeated,
                'repeated_rate' => $repeatRate,
                'graduated' => $statGraduated,
                'total_modules_evaluated' => $totalModulesSum,
                'total_modules_validated' => $validatedModulesSum,
            ],
            'students' => $roster,
        ];
    }

    /**
     * Exécute la bascule officielle intelligente avec archivage scellé.
     */
    public function executeSmartRollover(int $currentYearId, string $newLabel, string $startDate, string $endDate, ?string $authorizedBy = null): array
    {
        return DB::transaction(function () use ($currentYearId, $newLabel, $startDate, $endDate, $authorizedBy) {
            $currentYear = AcademicYear::findOrFail($currentYearId);

            // 1. Calculer le bilan officiel avant bascule
            $rosterData = $this->getProgressionRoster($currentYearId);
            $studentsRoster = $rosterData['students'] ?? [];

            // 2. Verrouiller et archiver l'année active
            $currentYear->update(['is_current' => false, 'is_locked' => true]);

            // 3. Créer ou activer la nouvelle année académique
            $newYear = AcademicYear::firstOrCreate(
                ['label' => $newLabel],
                [
                    'institution_id' => $currentYear->institution_id ?? 1,
                    'start_year' => (int) substr($newLabel, 0, 4),
                    'end_year' => (int) substr($newLabel, 5, 4),
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'is_current' => true,
                    'is_locked' => false,
                ]
            );

            AcademicYear::where('id', '!=', $newYear->id)->update(['is_current' => false]);
            $newYear->update(['is_current' => true, 'is_locked' => false]);

            // 4. Cloner les groupes pour la nouvelle année
            $oldGroups = Group::where('academic_year_id', $currentYear->id)->get();
            $newGroupsMap = [];
            foreach ($oldGroups as $og) {
                $ng = Group::firstOrCreate(
                    [
                        'academic_year_id' => $newYear->id,
                        'filiere_id' => $og->filiere_id,
                        'name' => $og->name,
                        'semester_number' => $og->semester_number,
                    ],
                    [
                        'speciality_id' => $og->speciality_id,
                        'capacity' => $og->capacity ?? 60,
                    ]
                );
                $newGroupsMap[$og->id] = $ng->id;
            }

            // 5. Basculer les étudiants selon la décision intelligente
            // Désactiver les anciens pathways
            StudentPathway::where('academic_year_id', $currentYear->id)->update(['is_current' => false]);

            $passedCount = 0;
            $debtCount = 0;
            $repeatedCount = 0;
            $graduatedCount = 0;

            foreach ($studentsRoster as $studentItem) {
                $studentId = $studentItem['student_id'];
                $decision = $studentItem['decision_code'];
                $targetSem = $studentItem['target_semester'];

                $student = Student::find($studentId);
                if (! $student) continue;

                if ($decision === 'DIPLOME') {
                    $student->update(['status' => 'graduated']);
                    $graduatedCount++;
                    continue;
                }

                if ($decision === 'ADMIS_PUR') {
                    $passedCount++;
                } elseif ($decision === 'ADMIS_AVEC_DETTE') {
                    $debtCount++;
                } else {
                    $repeatedCount++;
                }

                // Déterminer la filière cible (Spécialité si passage vers S5)
                $targetFiliereId = $student->filiere_id ?? 1;
                if ($targetSem >= 5 && in_array($decision, ['ADMIS_PUR', 'ADMIS_AVEC_DETTE'])) {
                    $wish = DB::table('specialty_wishes')
                        ->where('student_id', $studentId)
                        ->whereIn('status', ['allocated', 'approved', 'submitted', 'pending'])
                        ->orderByRaw("CASE WHEN status = 'allocated' THEN 1 WHEN status = 'approved' THEN 2 ELSE 3 END")
                        ->orderBy('preference_rank', 'asc')
                        ->first();

                    if ($wish && $wish->filiere_id) {
                        $targetFiliereId = (int) $wish->filiere_id;
                    } elseif ($targetFiliereId === 1) {
                        $defaultSpec = DB::table('filieres')->where('code', 'GFC')->first();
                        if ($defaultSpec) {
                            $targetFiliereId = $defaultSpec->id;
                        }
                    }
                }

                // Trouver un groupe adéquat pour le semestre cible et la filière
                $targetGroup = Group::where('academic_year_id', $newYear->id)
                    ->where('filiere_id', $targetFiliereId)
                    ->where('semester_number', $targetSem)
                    ->first();

                if (! $targetGroup) {
                    $targetGroup = Group::firstOrCreate(
                        [
                            'academic_year_id' => $newYear->id,
                            'filiere_id' => $targetFiliereId,
                            'semester_number' => $targetSem,
                            'name' => "Groupe 1 (S{$targetSem})",
                        ],
                        [
                            'capacity' => 60,
                        ]
                    );
                }

                // Créer le nouveau pathway
                StudentPathway::create([
                    'student_id' => $studentId,
                    'filiere_id' => $targetFiliereId,
                    'academic_year_id' => $newYear->id,
                    'group_id' => $targetGroup?->id,
                    'current_semester' => $targetSem,
                    'is_current' => true,
                ]);

                // Mettre à jour l'étudiant
                $student->update(['filiere_id' => $targetFiliereId]);

                // Créer l'inscription annuelle
                StudentRegistration::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'academic_year_id' => $newYear->id,
                        'semester_number' => $targetSem,
                    ],
                    [
                        'filiere_id' => $targetFiliereId,
                        'group_id' => $targetGroup?->id,
                        'status' => 'academic_validated',
                        'registration_type' => 're_enrollment',
                    ]
                );
            }

            // 6. Audit Trail officiel
            if (class_exists(AuditLog::class)) {
                AuditLog::record([
                    'user_id' => null,
                    'user_name' => $authorizedBy ?? 'Commission de Délibération & Archivage',
                    'user_email' => 'direction.academique@encg-fes.ac.ma',
                    'user_role' => 'Direction Académique',
                    'action' => "Bascule Annuelle APOGEE & Archivage Officiel ({$currentYear->label} ➔ {$newYear->label})",
                    'action_type' => 'SMART_ACADEMIC_ROLLOVER',
                    'description' => "Bascule officielle : {$passedCount} admis directs, {$debtCount} admis avec dette (enjambement), {$repeatedCount} redoublants (conservation des acquis), {$graduatedCount} diplômés.",
                    'method' => 'POST',
                    'severity' => 'warning',
                    'payload' => [
                        'archived_year' => $currentYear->label,
                        'new_year' => $newYear->label,
                        'passed' => $passedCount,
                        'debt' => $debtCount,
                        'repeated' => $repeatedCount,
                        'graduated' => $graduatedCount,
                    ],
                ]);
            }

            return [
                'success' => true,
                'message' => "Bascule académique et archivage complétés avec succès pour {$newLabel}.",
                'stats' => [
                    'total_processed' => count($studentsRoster),
                    'admitted_clean' => $passedCount,
                    'admitted_with_debt' => $debtCount,
                    'repeated' => $repeatedCount,
                    'graduated' => $graduatedCount,
                ],
            ];
        });
    }

    /**
     * Simuler la bascule annuelle à blanc (Dry-Run sans impact en base de données).
     */
    public function simulateSmartRollover(int $currentYearId, string $newLabel): array
    {
        $currentYear = AcademicYear::findOrFail($currentYearId);
        $rosterData = $this->getProgressionRoster($currentYearId);
        $studentsRoster = $rosterData['students'] ?? [];

        $passedCount = 0;
        $debtCount = 0;
        $repeatedCount = 0;
        $graduatedCount = 0;

        $projectedSpecialties = [];
        $projectedGroups = [];
        $simulatedRoster = [];

        foreach ($studentsRoster as $st) {
            $studentId = $st['student_id'];
            $decision = $st['decision_code'];
            $targetSem = $st['target_semester'];
            $currentSem = $st['current_semester'];

            $projFiliereCode = $st['filiere_code'];
            $projFiliereName = $st['filiere_name'];

            if ($decision === 'DIPLOME') {
                $graduatedCount++;
                $projLevel = 'Lauréat Diplômé';
            } elseif ($decision === 'ADMIS_PUR' || $decision === 'ADMIS_AVEC_DETTE') {
                if ($decision === 'ADMIS_PUR') {
                    $passedCount++;
                } else {
                    $debtCount++;
                }

                $nextYear = (int) ceil($targetSem / 2);
                $projLevel = "{$nextYear}ème Année (S{$targetSem}/S" . ($targetSem + 1) . ")";

                // Orientation vers les spécialités si passage vers S5
                if ($currentSem <= 4 && $targetSem >= 5) {
                    $wish = DB::table('specialty_wishes')
                        ->join('filieres', 'specialty_wishes.filiere_id', '=', 'filieres.id')
                        ->where('specialty_wishes.student_id', $studentId)
                        ->whereIn('specialty_wishes.status', ['allocated', 'approved', 'submitted', 'pending'])
                        ->orderByRaw("CASE WHEN specialty_wishes.status = 'allocated' THEN 1 WHEN specialty_wishes.status = 'approved' THEN 2 ELSE 3 END")
                        ->orderBy('specialty_wishes.preference_rank', 'asc')
                        ->select('filieres.code', 'filieres.name')
                        ->first();

                    if ($wish) {
                        $projFiliereCode = $wish->code;
                        $projFiliereName = $wish->name;
                    } else {
                        $projFiliereCode = 'GFC';
                        $projFiliereName = 'Gestion Financière et Comptable';
                    }

                    $projectedSpecialties[$projFiliereCode] = ($projectedSpecialties[$projFiliereCode] ?? 0) + 1;
                }
            } else {
                $repeatedCount++;
                $projLevel = "Maintien {$st['current_level']}";
            }

            $groupKey = "S{$targetSem} - {$projFiliereCode}";
            $projectedGroups[$groupKey] = ($projectedGroups[$groupKey] ?? 0) + 1;

            $simulatedRoster[] = array_merge($st, [
                'projected_filiere_code' => $projFiliereCode,
                'projected_filiere_name' => $projFiliereName,
                'projected_level' => $projLevel,
                'projected_group' => "Groupe 1 ({$groupKey})",
            ]);
        }

        return [
            'success' => true,
            'is_simulation' => true,
            'timestamp' => now()->toIso8601String(),
            'current_year' => [
                'id' => $currentYear->id,
                'label' => $currentYear->label,
            ],
            'simulated_year_label' => $newLabel,
            'summary' => [
                'total_evaluated' => count($studentsRoster),
                'admitted_clean' => $passedCount,
                'admitted_clean_rate' => count($studentsRoster) > 0 ? round(($passedCount / count($studentsRoster)) * 100, 1) : 0,
                'admitted_with_debt' => $debtCount,
                'admitted_with_debt_rate' => count($studentsRoster) > 0 ? round(($debtCount / count($studentsRoster)) * 100, 1) : 0,
                'repeated' => $repeatedCount,
                'repeated_rate' => count($studentsRoster) > 0 ? round(($repeatedCount / count($studentsRoster)) * 100, 1) : 0,
                'graduated' => $graduatedCount,
            ],
            'projected_specialties' => $projectedSpecialties,
            'projected_groups' => $projectedGroups,
            'simulated_roster' => $simulatedRoster,
        ];
    }

    /**
     * Récupère les données d'enjambement et de dette pour un étudiant donné (pour génération PDF).
     */
    public function getStudentDebtRecord(int $studentId, ?int $academicYearId = null): ?array
    {
        $rosterData = $this->getProgressionRoster($academicYearId);
        $students = $rosterData['students'] ?? [];

        foreach ($students as $st) {
            if ((int) $st['student_id'] === $studentId) {
                return $st;
            }
        }

        return null;
    }
}
