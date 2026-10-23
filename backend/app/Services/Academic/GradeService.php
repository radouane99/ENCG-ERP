<?php

namespace App\Services\Academic;

use App\Domain\Deliberation\LmdRules;
use App\Exceptions\OptimisticLockException;
use App\Models\Assessment;
use App\Models\DisciplinaryCase;
use App\Models\ExamIncident;
use App\Models\Grade;
use App\Models\Institution;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\ModulePvSignature;
use App\Models\Professor;
use App\Models\ResitEligibility;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GradeService
{
    /**
     * Récupérer les étudiants inscrits pour un module et éventuellement un groupe.
     */
    public function getRegisteredStudents(Module $module, $groupId = null)
    {
        if ($groupId === 'all' || $groupId === '' || $groupId === 'undefined' || $groupId === 'null') {
            $groupId = null;
        }

        $yearId = AcademicContext::yearId();
        $query = Student::with('user')->where(function ($q) use ($module, $groupId, $yearId) {
            $q->whereHas('pathways', fn ($p) => $p->where('academic_year_id', $yearId)->where('filiere_id', $module->filiere_id)
                ->where('current_semester', $module->semester_number)->when($groupId, fn ($p) => $p->where('group_id', $groupId)))
                ->orWhereHas('registrations', fn ($p) => $p->where('academic_year_id', $yearId)->where('filiere_id', $module->filiere_id)
                    ->where('semester_number', $module->semester_number)->when($groupId, fn ($p) => $p->where('group_id', $groupId)));
        });
        $actor = request()->user();
        if ($actor?->hasAnyRole(['professor', 'vacataire']) && ! $actor->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director'])) {
            $assignments = ModuleProfessor::where('module_id', $module->id)->where('academic_year_id', $yearId)->where('professor_id', $actor->professor?->id)->get();
            if (! $assignments->contains(fn ($a) => $a->group_id === null)) {
                $groupIds = $assignments->pluck('group_id');
                $query->where(fn ($q) => $q->whereHas('pathways', fn ($p) => $p->where('academic_year_id', $yearId)->whereIn('group_id', $groupIds))
                    ->orWhereHas('registrations', fn ($p) => $p->where('academic_year_id', $yearId)->whereIn('group_id', $groupIds)));
            }
        }
        $students = $query->orderBy('student_number')->get();

        return $students->sortBy(fn ($s) => ($s->last_name ?? '').' '.($s->first_name ?? ''))->values();
    }

    /**
     * Récupérer les IDs des étudiants ayant une fraude signalée.
     */
    public function getFraudStudentIds(Module $module): array
    {
        $incidents = ExamIncident::whereHas('exam', function ($q) use ($module) {
            $q->where('module_id', $module->id);
        })->whereIn('type', ['fraude', 'fraud', 'tricherie', 'cheating'])->pluck('student_id')->toArray();

        $cases = DisciplinaryCase::whereIn('infraction_type', ['fraude', 'fraud', 'tricherie', 'cheating'])
            ->pluck('student_id')->toArray();

        return array_values(array_unique(array_merge($incidents, $cases)));
    }

    /**
     * Vérifie si l'évaluation est un rattrapage.
     */
    public function isRattrapageAssessment(Assessment $assessment): bool
    {
        $type = strtolower(trim((string) $assessment->type));

        return in_array($type, ['rattrapage', 'r', 'resit']);
    }

    /**
     * Vérifie si le PV de note est signé pour une session donnée.
     */
    public function isPvSigned(int $moduleId, ?string $session = null): bool
    {
        $query = ModulePvSignature::where('module_id', $moduleId);
        if ($session) {
            $query->where('session', $session);
        }

        return $query->exists();
    }

    /**
     * Vérifie si l'étudiant est en situation de fraude.
     */
    public function isStudentFraud(int $studentId, array $fraudIds): bool
    {
        return in_array($studentId, $fraudIds);
    }

    /**
     * Vérifie si l'évaluation est une épreuve d'examen (et non un contrôle continu / TP / Projet).
     */
    public function isExamAssessment(Assessment $assessment): bool
    {
        $type = strtolower(trim((string) $assessment->type));

        // CC, CC1, CC2, TP, Projet sont des contrôles continus, PAS des examens terminaux !
        if (in_array($type, ['cc', 'cc1', 'cc2', 'cc3', 'tp', 'tp1', 'tp2', 'projet', 'expose', 'devoir'])
            || str_starts_with($type, 'cc')
            || str_starts_with($type, 'tp')
            || str_contains($type, 'continu')) {
            return false;
        }

        return in_array($type, ['exam', 'examen', 'final', 'examen final', 'examen ordinaire', 'eo', 'ef', 'rattrapage', 'resit', 'r'])
            || str_contains($type, 'exam');
    }

    /**
     * Vérifie si la saisie des notes de l'examen est verrouillée selon la phase globale de l'établissement.
     */
    public function isExamLocked(Assessment $assessment): ?string
    {
        $institution = Institution::first();
        if (! $institution) {
            return null;
        }

        $settings = is_array($institution->settings)
            ? $institution->settings
            : (is_string($institution->settings) ? json_decode($institution->settings, true) : []);

        $currentPhase = $settings['exam_lock_phase'] ?? 'Verrouillé';
        $deadline = $settings['exam_lock_deadline'] ?? null;

        // 1. Verrouillage total ou statut verrouillé
        if (in_array($currentPhase, ['Verrouillage Total', 'Verrouillé'])) {
            return "La saisie des notes d'examen et de rattrapage est actuellement verrouillée par l'administration (Phase: {$currentPhase}).";
        }

        // 2. Vérification de la date limite officielle (si configurée)
        if ($deadline) {
            try {
                if (Carbon::parse($deadline)->isPast()) {
                    return "Le délai limite officiel fixé par l'administration pour cette session est expiré ({$deadline}). Les modifications sont bloquées.";
                }
            } catch (\Throwable) {
            }
        }

        $isRattrapage = $this->isRattrapageAssessment($assessment);
        $isExam = $this->isExamAssessment($assessment);

        // Si ce n'est ni un examen ni un rattrapage (ex: CC1, CC2, TP, devoir), la saisie reste ouverte (contrôle continu)
        if (! $isRattrapage && ! $isExam) {
            return null;
        }

        // Déterminer le semestre du module (Impairs = Automne [S1, S3, S5, S7, S9], Pairs = Printemps [S2, S4, S6, S8, S10])
        $module = $assessment->relationLoaded('module') ? $assessment->module : ($assessment->module_id ? Module::find($assessment->module_id) : null);
        $semNum = (int) ($module?->semester_number ?? 1);
        $isOddSemester = ($semNum % 2 !== 0); // Automne
        $isEvenSemester = ! $isOddSemester;   // Printemps

        // 3. Vérification selon les 4 phases de la matrice de verrouillage
        switch ($currentPhase) {
            case 'Ordinaire Automne':
                if ($isEvenSemester) {
                    return 'La phase active est « Ordinaire Automne ». La saisie pour les semestres pairs (Printemps) est verrouillée.';
                }
                if ($isRattrapage) {
                    return "La session de rattrapage d'automne est actuellement verrouillée (fermée). Seule la session ordinaire d'automne est ouverte.";
                }
                break;

            case 'Rattrapage Automne':
                if ($isEvenSemester) {
                    return 'La phase active est « Rattrapage Automne ». La saisie pour les semestres pairs (Printemps) est verrouillée.';
                }
                if (! $isRattrapage) {
                    return "La session ordinaire d'automne est clôturée. Seule la saisie des notes de rattrapage d'automne est autorisée.";
                }
                break;

            case 'Ordinaire Printemps':
                if ($isOddSemester) {
                    return 'La phase active est « Ordinaire Printemps ». La saisie pour les semestres impairs (Automne) est verrouillée.';
                }
                if ($isRattrapage) {
                    return 'La session de rattrapage de printemps est actuellement verrouillée (fermée). Seule la session ordinaire de printemps est ouverte.';
                }
                break;

            case 'Rattrapage Printemps':
                if ($isOddSemester) {
                    return 'La phase active est « Rattrapage Printemps ». La saisie pour les semestres impairs (Automne) est verrouillée.';
                }
                if (! $isRattrapage) {
                    return 'La session ordinaire de printemps est clôturée. Seule la saisie des notes de rattrapage de printemps est autorisée.';
                }
                break;

            default:
                if ($isRattrapage && ! str_contains(strtolower($currentPhase), 'rattrapage')) {
                    return "La session de rattrapage n'est pas ouverte par l'administration (Phase actuelle : {$currentPhase}).";
                }
                break;
        }

        return null;
    }

    /**
     * Vérifie si l'utilisateur/professeur est assigné au module.
     */
    public function isProfessorAssignedToModule(int $userId, int $moduleId): bool
    {
        // Liaison stricte users.id → professors.user_id (aucun fallback email/id).
        $prof = Professor::where('user_id', $userId)->first();
        if (! $prof) {
            return false;
        }

        return ModuleProfessor::where('professor_id', $prof->id)
            ->where('module_id', $moduleId)
            ->where('academic_year_id', AcademicContext::yearId())
            ->exists();
    }

    /**
     * Calcule la moyenne pondérée pour la session ordinaire.
     */
    public function calculateWeightedAverage(Student $student, $normaleAssessments, array $fraudIds = []): ?float
    {
        if (in_array($student->id, $fraudIds)) {
            return 0.0;
        }

        $totalWeight = 0;
        $weightedSum = 0;
        $hasGrades = false;

        foreach ($normaleAssessments as $assessment) {
            $weight = (float) ($assessment->weight ?? 1.0);
            $grade = Grade::where('student_id', $student->id)
                ->where('assessment_id', $assessment->id)
                ->first();

            if ($grade) {
                $hasGrades = true;
                if (! $grade->absent && $grade->value !== null) {
                    $weightedSum += ((float) $grade->value) * $weight;
                }
            }
            $totalWeight += $weight;
        }

        if (! $hasGrades || $totalWeight == 0) {
            return null;
        }

        return round($weightedSum / $totalWeight, 2);
    }

    /**
     * Détermine la décision de session ordinaire.
     */
    public function determineDecision(?float $moyenne): string
    {
        if ($moyenne === null) {
            return 'DEF';
        }
        if ($moyenne >= LmdRules::VALIDATION_THRESHOLD) {
            return 'V';
        }
        if ($moyenne >= LmdRules::ELIMINATORY_THRESHOLD) {
            return 'R';
        }

        return 'NV';
    }

    /**
     * Calcule la note/moyenne de rattrapage en remplaçant l'examen par la note de rattrapage.
     */
    public function calculateRattrapageAverage(Student $student, $normaleAssessments, Assessment $rattrapageAssessment): ?float
    {
        $rGrade = Grade::where('student_id', $student->id)
            ->where('assessment_id', $rattrapageAssessment->id)
            ->first();

        if (! $rGrade || $rGrade->absent || $rGrade->value === null) {
            return null;
        }

        $rattrapageValue = (float) $rGrade->value;
        $totalWeight = 0;
        $weightedSum = 0;

        foreach ($normaleAssessments as $assessment) {
            $weight = (float) ($assessment->weight ?? 1.0);
            $typeLower = strtolower(trim((string) $assessment->type));
            $isExam = in_array($typeLower, ['exam', 'examen', 'final']);

            if ($isExam) {
                // L'épreuve d'examen final est remplacée par la note de Rattrapage
                $weightedSum += $rattrapageValue * $weight;
            } else {
                // Les contrôles continus (CC1, CC2, TP...) sont conservés
                $g = Grade::where('student_id', $student->id)
                    ->where('assessment_id', $assessment->id)
                    ->first();
                if ($g && ! $g->absent && $g->value !== null) {
                    $weightedSum += ((float) $g->value) * $weight;
                }
            }
            $totalWeight += $weight;
        }

        if ($totalWeight == 0) {
            return round($rattrapageValue, 2);
        }

        return round($weightedSum / $totalWeight, 2);
    }

    /**
     * Détermine la décision finale après rattrapage.
     */
    public function determineFinalDecision(?float $moyenneNormale, ?float $moyenneFinale): string
    {
        if ($moyenneFinale === null) {
            return $this->determineDecision($moyenneNormale);
        }
        if ($moyenneFinale >= 10.0) {
            return ($moyenneNormale !== null && $moyenneNormale < 10.0) ? 'VAR' : 'V';
        }

        return 'NV';
    }

    /**
     * Détermine la décision et la moyenne finale après rattrapage avec plafonnement à 12.00/20 pour VAR.
     */
    public function determineFinalRattrapageResult(?float $moyenneNormale, ?float $moyenneRattrapage): array
    {
        if ($moyenneRattrapage === null) {
            return [
                'moyenne_finale' => $moyenneNormale,
                'decision_finale' => $this->determineDecision($moyenneNormale),
            ];
        }

        $rawAverage = max($moyenneNormale ?? 0, $moyenneRattrapage);

        if ($rawAverage >= 10.0) {
            $isValidatedViaRattrapage = ($moyenneNormale === null || $moyenneNormale < 10.0);
            if ($isValidatedViaRattrapage) {
                // Plafonnement à 12.00/20 pour la validation après rattrapage (VAR)
                return [
                    'moyenne_finale' => min(12.00, round($rawAverage, 2)),
                    'decision_finale' => 'VAR',
                ];
            }

            return [
                'moyenne_finale' => round($rawAverage, 2),
                'decision_finale' => 'V',
            ];
        }

        return [
            'moyenne_finale' => round($rawAverage, 2),
            'decision_finale' => 'NV',
        ];
    }

    /**
     * Génère les éligibilités au rattrapage.
     */
    public function generateRattrapageEligibilities(Module $module, $students, $normaleAssessments): array
    {
        $created = 0;
        $updated = 0;

        foreach ($students as $student) {
            $moyenne = $this->calculateWeightedAverage($student, $normaleAssessments, []);
            $decision = $this->determineDecision($moyenne);

            if (in_array($decision, ['R', 'NV'])) {
                $record = ResitEligibility::updateOrCreate(
                    [
                        'module_id' => $module->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'is_eligible' => true,
                        'status' => 'eligible',
                        'reason' => "Moyenne initiale: {$moyenne}/20 ({$decision})",
                    ]
                );

                if ($record->wasRecentlyCreated) {
                    $created++;
                } else {
                    $updated++;
                }
            }
        }

        return ['created' => $created, 'updated' => $updated];
    }

    /**
     * Calcule les statistiques d'une promotion/module.
     */
    public function calculateAnalytics($data): array
    {
        $collection = collect($data);
        if ($collection->isEmpty()) {
            return [
                'avg' => 0,
                'median' => 0,
                'pass_rate' => 0,
                'min' => 0,
                'max' => 0,
                'total' => 0,
                'admis' => 0,
                'rattrapage' => 0,
                'elimines' => 0,
                'distribution' => [],
            ];
        }

        $validGrades = $collection->map(function ($item) {
            return $item['moyenne_finale'] ?? $item['moyenne_normale'] ?? null;
        })->filter(fn ($v) => $v !== null)->map(fn ($v) => (float) $v)->values();

        $total = $collection->count();
        $admis = $collection->filter(fn ($item) => in_array($item['decision_finale'] ?? $item['decision_normale'] ?? '', ['V', 'VAR']))->count();
        $rattrapage = $collection->filter(fn ($item) => ($item['decision_normale'] ?? '') === 'R' || ($item['decision_finale'] ?? '') === 'R')->count();
        $elimines = max(0, $total - $admis - $rattrapage);

        // Compute median
        $median = 0;
        if ($validGrades->isNotEmpty()) {
            $sorted = $validGrades->sort()->values();
            $count = $sorted->count();
            $middle = (int) floor($count / 2);
            if ($count % 2 == 0) {
                $median = ($sorted[$middle - 1] + $sorted[$middle]) / 2;
            } else {
                $median = $sorted[$middle];
            }
        }

        // Compute 10-bucket Gauss distribution
        $distribution = [
            ['range' => '0-2', 'count' => 0],
            ['range' => '2-4', 'count' => 0],
            ['range' => '4-6', 'count' => 0],
            ['range' => '6-8', 'count' => 0],
            ['range' => '8-10', 'count' => 0],
            ['range' => '10-12', 'count' => 0],
            ['range' => '12-14', 'count' => 0],
            ['range' => '14-16', 'count' => 0],
            ['range' => '16-18', 'count' => 0],
            ['range' => '18-20', 'count' => 0],
        ];

        foreach ($validGrades as $g) {
            if ($g < 2) {
                $distribution[0]['count']++;
            } elseif ($g < 4) {
                $distribution[1]['count']++;
            } elseif ($g < 6) {
                $distribution[2]['count']++;
            } elseif ($g < 8) {
                $distribution[3]['count']++;
            } elseif ($g < 10) {
                $distribution[4]['count']++;
            } elseif ($g < 12) {
                $distribution[5]['count']++;
            } elseif ($g < 14) {
                $distribution[6]['count']++;
            } elseif ($g < 16) {
                $distribution[7]['count']++;
            } elseif ($g < 18) {
                $distribution[8]['count']++;
            } else {
                $distribution[9]['count']++;
            }
        }

        return [
            'avg' => $validGrades->isNotEmpty() ? round($validGrades->avg(), 2) : 0,
            'median' => round($median, 2),
            'pass_rate' => $total > 0 ? round(($admis / $total) * 100, 1) : 0,
            'min' => $validGrades->isNotEmpty() ? round($validGrades->min(), 2) : 0,
            'max' => $validGrades->isNotEmpty() ? round($validGrades->max(), 2) : 0,
            'total' => $total,
            'admis' => $admis,
            'rattrapage' => $rattrapage,
            'elimines' => $elimines,
            'distribution' => $distribution,
        ];
    }

    /**
     * Enregistrer ou mettre à jour un lot de notes.
     */
    public function storeBatch(array $gradesData): array
    {
        return DB::transaction(function () use ($gradesData) {
            $savedCount = 0;

            foreach ($gradesData as $gradeData) {
                $grade = Grade::where('student_id', $gradeData['student_id'])
                    ->where('assessment_id', $gradeData['assessment_id'])->lockForUpdate()->first();
                if ((int) ($gradeData['version'] ?? 0) !== (int) ($grade?->version ?? 0)) {
                    throw new OptimisticLockException;
                }
                $grade ??= new Grade(['student_id' => $gradeData['student_id'], 'assessment_id' => $gradeData['assessment_id']]);
                $grade->fill(['value' => $gradeData['value'] ?? null, 'absent' => $gradeData['absent'] ?? false])->save();
                $savedCount++;
            }

            return ['success' => true, 'count' => $savedCount];
        });
    }

    /**
     * Valider définitivement les notes d'un module.
     */
    public function validateGrades(int $moduleId): int
    {
        return Grade::whereHas('assessment', fn ($q) => $q->where('module_id', $moduleId))
            ->update(['version' => DB::raw('version + 1')]);
    }
}
