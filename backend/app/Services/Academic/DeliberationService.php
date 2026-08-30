<?php

namespace App\Services\Academic;

use App\Domain\Deliberation\LmdRules;
use App\Models\AcademicYear;
use App\Models\DeliberationJury;
use App\Models\ExamIncident;
use App\Models\ExamSession;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\ModulePvSignature;
use App\Models\ModuleValidation;
use App\Models\ResitEligibility;
use App\Models\Student;
use App\Models\StudentModuleRetake;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;

class DeliberationService
{
    /**
     * Traiter la délibération d'un module.
     */
    public function processModuleDeliberation(int $moduleId, ?int $examSessionId = null): array
    {
        $module = Module::with('assessments')->findOrFail($moduleId);

        if ($module->assessments->isEmpty()) {
            return ['status' => 'error', 'message' => 'Ce module n\'a aucune évaluation.'];
        }

        $normalAssessments = $module->assessments->filter(fn ($a) => ! str_contains(strtolower($a->type), 'rattrapage'));
        $assessmentIds = $normalAssessments->pluck('id')->toArray();

        if (empty($assessmentIds)) {
            return ['status' => 'error', 'message' => 'Aucune évaluation de session normale trouvée.'];
        }

        $grades = Grade::whereIn('assessment_id', $assessmentIds)->get();
        $studentGrades = $grades->groupBy('student_id');

        $sessionId = $examSessionId ?? ExamSession::where('is_active', true)->value('id');
        if (! $sessionId) {
            throw new \InvalidArgumentException('Session d\'examen active requise.');
        }

        $validated = 0;
        $rattrapage = 0;
        $failed = 0;

        foreach ($studentGrades as $studentId => $records) {
            $finalScore = 0;
            $hasAbsent = false;

            foreach ($normalAssessments as $assessment) {
                $record = $records->firstWhere('assessment_id', $assessment->id);

                if (! $record || $record->absent) {
                    $hasAbsent = true;
                } else {
                    $finalScore += ($record->value * ($assessment->weight / 100));
                }
            }

            if ($hasAbsent || $finalScore < 5) {
                $failed++;
                StudentModuleRetake::updateOrCreate(
                    ['student_id' => $studentId, 'module_id' => $moduleId, 'academic_year_id' => $sessionId],
                    ['status' => 'pending']
                );
            } elseif ($finalScore >= 10) {
                $validated++;
                ModuleValidation::updateOrCreate(
                    ['student_id' => $studentId, 'module_id' => $moduleId],
                    [
                        'final_grade' => round($finalScore, 2),
                        'validated_at_session_id' => $sessionId,
                        'status' => 'validated',
                    ]
                );
                StudentModuleRetake::where('student_id', $studentId)
                    ->where('module_id', $moduleId)
                    ->where('status', 'pending')
                    ->update(['status' => 'passed']);
            } else {
                $rattrapage++;
                ResitEligibility::updateOrCreate(
                    ['student_id' => $studentId, 'module_id' => $moduleId, 'exam_session_id' => $sessionId],
                    ['is_eligible' => true]
                );
            }
        }

        return [
            'status' => 'success',
            'validated' => $validated,
            'rattrapage' => $rattrapage,
            'failed' => $failed,
            'total_processed' => $studentGrades->count(),
        ];
    }

    /**
     * PV global pour un étudiant.
     */
    public function generateGlobalPV(int $studentId, int $academicYearId): array
    {
        $currentPathway = StudentPathway::where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->latest('id')
            ->first();

        $modulesToAssess = collect();

        if ($currentPathway) {
            $semesterModules = Module::where('filiere_id', $currentPathway->filiere_id)
                ->where('semester_number', $currentPathway->semester_number)
                ->get();
            $modulesToAssess = $modulesToAssess->merge($semesterModules);
        }

        $retakeModuleIds = StudentModuleRetake::where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->pluck('module_id');

        if ($retakeModuleIds->isNotEmpty()) {
            $retakeModules = Module::whereIn('id', $retakeModuleIds)->get();
            $modulesToAssess = $modulesToAssess->merge($retakeModules);
        }

        $historicalValidations = ModuleValidation::where('student_id', $studentId)
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
                'status' => 'pending',
                'is_retake' => $retakeModuleIds->contains($module->id),
                'is_historical' => false,
            ];

            if ($historicalValidations->has($module->id) && ! $record['is_retake']) {
                $record['grade'] = $historicalValidations->get($module->id)->final_grade;
                $record['status'] = 'validated';
                $record['is_historical'] = true;
            } else {
                $currentGradeRaw = Grade::where('student_id', $studentId)
                    ->whereHas('assessment', fn ($q) => $q->where('module_id', $module->id))
                    ->selectRaw('SUM(value * (SELECT weight FROM assessments WHERE id = grades.assessment_id) / 100) as final_score')
                    ->value('final_score');

                if ($currentGradeRaw !== null) {
                    $record['grade'] = round($currentGradeRaw, 2);
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
            'global_status' => $globalAverage >= 10 ? 'passed' : 'failed',
        ];
    }

    /**
     * PV semestriel avec réservistes.
     */
    public function getSemesterPVWithReservistes(int $filiereId, int $academicYearId, int $semesterNumber): array
    {
        $modules = Module::with('assessments')->where('filiere_id', $filiereId)->where('semester_number', $semesterNumber)->get();
        $moduleIds = $modules->pluck('id')->toArray();

        $regularStudentIds = StudentRegistration::where('filiere_id', $filiereId)
            ->where('academic_year_id', $academicYearId)
            ->where('semester_number', $semesterNumber)
            ->pluck('student_id')
            ->toArray();

        $reservisteStudentIds = StudentModuleRetake::whereIn('module_id', $moduleIds)
            ->where('academic_year_id', $academicYearId)
            ->pluck('student_id')
            ->toArray();

        $allStudentIds = array_unique(array_merge($regularStudentIds, $reservisteStudentIds));

        $students = Student::with('user')->whereIn('id', $allStudentIds)->orderBy('last_name')->get();

        $historical = ModuleValidation::whereIn('module_id', $moduleIds)->whereIn('student_id', $allStudentIds)->get()->keyBy(fn ($v) => $v->student_id.'_'.$v->module_id);
        $currentGrades = Grade::with('assessment')->whereIn('student_id', $allStudentIds)
            ->whereHas('assessment', fn ($q) => $q->whereIn('module_id', $moduleIds))
            ->get()
            ->groupBy('student_id')
            ->map(fn ($grades) => $grades->groupBy(fn ($g) => $g->assessment->module_id));

        $matrix = [];

        foreach ($students as $student) {
            $isReserviste = ! in_array($student->id, $regularStudentIds);
            $moduleResults = [];
            $totalScore = 0;
            $totalCoef = 0;
            $hasEliminatory = false;

            foreach ($modules as $module) {
                $coef = $module->coefficient ?? 1.0;
                $totalCoef += $coef;
                $key = $student->id.'_'.$module->id;

                if ($historical->has($key)) {
                    $histVal = $historical->get($key);
                    $gradeVal = round($histVal->final_grade, 2);
                    $moduleResults[$module->id] = ['grade' => $gradeVal, 'status' => 'V.Anté', 'is_historical' => true];
                    $totalScore += ($gradeVal * $coef);
                } elseif ($currentGrades->has($student->id) && $currentGrades->get($student->id)->has($module->id)) {
                    $mGrades = $currentGrades->get($student->id)->get($module->id);
                    $score = $this->calculateModuleScore($mGrades);
                    $score = round($score, 2);
                    if (LmdRules::isEliminatory($score)) {
                        $hasEliminatory = true;
                    }
                    $status = $score >= LmdRules::VALIDATION_THRESHOLD ? 'V' : ($score >= LmdRules::ELIMINATORY_THRESHOLD ? 'RAT' : 'NV');
                    $moduleResults[$module->id] = ['grade' => $score, 'status' => $status, 'is_historical' => false];
                    $totalScore += ($score * $coef);
                } else {
                    $moduleResults[$module->id] = ['grade' => null, 'status' => 'PENDING', 'is_historical' => false];
                }
            }

            $semesterAvg = $totalCoef > 0 ? round($totalScore / $totalCoef, 2) : 0;
            $decision = match (true) {
                $semesterAvg >= 10.0 && ! $hasEliminatory => 'V',
                $semesterAvg >= 5.0 => 'RAT',
                default => 'AJ',
            };

            $matrix[] = [
                'student_id' => $student->id,
                'student' => mb_strtoupper($student->last_name).' '.$student->first_name,
                'cne' => $student->cne ?? $student->student_number,
                'cin' => $student->cin ?? $student->user?->cin ?? '',
                'is_reserviste' => $isReserviste,
                'semester_average' => $semesterAvg,
                'decision' => $decision,
                'modules' => $moduleResults,
            ];
        }

        return compact('modules', 'matrix');
    }

    /**
     * Composer automatiquement le jury.
     */
    public function autoComposeJury(int $filiereId, int $academicYearId, ?int $semesterNumber = null, string $type = 'semestriel'): array
    {
        $modules = Module::with('assessments')
            ->where('filiere_id', $filiereId)
            ->when($type === 'semestriel' && $semesterNumber, fn ($q) => $q->where('semester_number', $semesterNumber))
            ->get();

        $juryMembers = [];

        foreach ($modules as $module) {
            $profRecord = ModuleProfessor::with('professor.user')
                ->where('module_id', $module->id)
                ->first();

            // Check if there is an existing Module PV signature recorded for this module
            $modSig = ModulePvSignature::where('module_id', $module->id)->with('signer')->latest()->first();

            $userId = $modSig?->signed_by ?? $profRecord?->professor?->user?->id;
            $userName = $modSig?->signer?->name ?? $profRecord?->professor?->user?->name ?? "Enseignant ({$module->code})";

            $isAlreadySigned = $modSig !== null;

            $jury = DeliberationJury::firstOrCreate(
                [
                    'filiere_id' => $filiereId,
                    'academic_year_id' => $academicYearId,
                    'type' => $type,
                    'module_id' => $module->id,
                    'semester_number' => $semesterNumber,
                ],
                [
                    'user_id' => $userId,
                    'user_name' => $userName,
                    'role' => 'professeur',
                    'status' => $isAlreadySigned ? 'signed' : 'pending',
                    'signed_at' => $modSig?->signed_at ?? ($isAlreadySigned ? now() : null),
                    'digital_seal' => $modSig?->seal_hash ?? ($isAlreadySigned ? 'SIG-MODULE-OK' : null),
                    'signature_data' => $modSig?->signature_data,
                ]
            );

            // Sync if signed in module_pv_signatures after jury record creation
            if ($modSig && $jury->status !== 'signed') {
                $jury->update([
                    'status' => 'signed',
                    'signed_at' => $modSig->signed_at ?? now(),
                    'digital_seal' => $modSig->seal_hash ?? 'SIG-MODULE-OK',
                    'signature_data' => $modSig->signature_data,
                ]);
            }

            $juryMembers[] = [
                'id' => $jury->id,
                'module_id' => $module->id,
                'module_name' => $module->name,
                'module_code' => $module->code,
                'user_id' => $userId,
                'user_name' => $userName,
                'role' => 'professeur',
                'status' => $jury->status,
                'signed_at' => $jury->signed_at,
                'digital_seal' => $jury->digital_seal,
                'signature_image' => $jury->signature_data,
                'source' => $modSig ? 'module_pv' : 'manual',
            ];
        }

        // Chef de filière
        $filiere = Filiere::with('responsable')->find($filiereId);
        $chefUserId = $filiere?->responsable?->id ?? User::first()?->id;
        $chefName = $filiere?->responsable?->name ?? 'Chef de Filière';

        $chefJury = DeliberationJury::firstOrCreate(
            [
                'filiere_id' => $filiereId,
                'academic_year_id' => $academicYearId,
                'type' => $type,
                'role' => 'chef_filiere',
                'semester_number' => $semesterNumber,
            ],
            [
                'user_id' => $chefUserId,
                'user_name' => $chefName,
                'status' => 'pending',
            ]
        );

        $juryMembers[] = [
            'id' => $chefJury->id,
            'module_id' => null,
            'module_name' => 'Coordination Globale & Présidence du Jury',
            'module_code' => 'CHEF',
            'user_id' => $chefUserId,
            'user_name' => $chefName,
            'role' => 'chef_filiere',
            'status' => $chefJury->status,
            'signed_at' => $chefJury->signed_at,
            'digital_seal' => $chefJury->digital_seal,
            'signature_image' => $chefJury->signature_data,
        ];

        return $juryMembers;
    }

    /**
     * Signer le PV par un membre du jury.
     */
    public function signJuryPv(int $juryId, int $userId, string $signatureData, string $ipAddress): array
    {
        $jury = DeliberationJury::find($juryId);
        if (! $jury) {
            return ['status' => 'error', 'message' => 'Membre du jury introuvable.'];
        }

        $digitalSeal = hash('sha256', json_encode([
            'jury_id' => $juryId,
            'user_id' => $userId,
            'filiere_id' => $jury->filiere_id,
            'signed_at' => now()->toIso8601String(),
            'ip' => $ipAddress,
        ]));

        $jury->update([
            'status' => 'signed',
            'signed_at' => now(),
            'signature_data' => $signatureData,
            'digital_seal' => $digitalSeal,
            'ip_address' => $ipAddress,
        ]);

        return [
            'status' => 'success',
            'digital_seal' => $digitalSeal,
            'signed_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Compensation annuelle (S1+S2, S3+S4, etc.).
     */
    public function calculateAnnualCompensation(int $filiereId, int $academicYearId, ?int $yearLevel = 1): array
    {
        $yearLevel = $yearLevel ?: 1;
        $oddSemNumber = ($yearLevel * 2) - 1;  // e.g. 1, 3, 5, 7, 9
        $evenSemNumber = $yearLevel * 2;       // e.g. 2, 4, 6, 8, 10

        $students = Student::with('user')
            ->whereHas('registrations', function ($q) use ($filiereId, $academicYearId, $oddSemNumber, $evenSemNumber) {
                if ($filiereId) {
                    $q->where('filiere_id', $filiereId);
                }
                if ($academicYearId) {
                    $q->where('academic_year_id', $academicYearId);
                }
                $q->whereIn('semester_number', [$oddSemNumber, $evenSemNumber]);
            })->get();

        if ($students->isEmpty() && $filiereId) {
            $students = Student::with('user')
                ->whereHas('registrations', fn ($q) => $q->whereIn('semester_number', [$oddSemNumber, $evenSemNumber]))
                ->get();
        }

        if ($students->isEmpty()) {
            $students = Student::with('user')->has('grades')->get();
        }

        if ($students->isEmpty()) {
            $students = Student::with('user')->take(50)->get();
        }

        $academicYear = AcademicYear::find($academicYearId) ?? AcademicYear::where('is_current', true)->first();
        $academicYearName = $academicYear?->name ?? '2026/2027';

        $filiereModules = Module::where('filiere_id', $filiereId)
            ->whereIn('semester_number', [$oddSemNumber, $evenSemNumber])
            ->with('assessments')
            ->orderBy('semester_number')
            ->orderBy('id')
            ->get();

        if ($filiereModules->isEmpty()) {
            // Fallback to Tronc Commun (filiere_id = 1) for S1..S4 modules
            $filiereModules = Module::where('filiere_id', 1)
                ->whereIn('semester_number', [$oddSemNumber, $evenSemNumber])
                ->with('assessments')
                ->orderBy('semester_number')
                ->orderBy('id')
                ->get();
        }

        if ($filiereModules->isEmpty()) {
            $filiereModules = Module::whereIn('semester_number', [$oddSemNumber, $evenSemNumber])
                ->whereHas('assessments')
                ->with('assessments')
                ->orderBy('semester_number')
                ->orderBy('id')
                ->take(14)
                ->get();
        }

        if ($filiereModules->isEmpty()) {
            $filiereModules = Module::with('assessments')->orderBy('id')->take(14)->get();
        }

        $results = [];

        foreach ($students as $student) {
            $modulesDetailMap = [];
            $allModuleDetails = [];
            $hasEliminatory = false;

            foreach ($filiereModules as $mod) {
                // Check if student has a historical validation for this module from previous years
                $histVal = ModuleValidation::with('validatedAtSession.academicYear')
                    ->where('student_id', $student->id)
                    ->where('module_id', $mod->id)
                    ->first();

                $isHistorical = false;
                $validationYear = $academicYearName;

                if ($histVal && floatval($histVal->final_grade) >= 10.00) {
                    $finalNote = floatval($histVal->final_grade);
                    $moyNormale = $finalNote;
                    $modDecision = 'V';
                    $isHistorical = true;
                    $validationYear = $histVal->validatedAtSession?->academicYear?->name
                        ?? $validationYear;
                } else {
                    $studentGrades = Grade::where('student_id', $student->id)
                        ->whereIn('assessment_id', $mod->assessments->pluck('id'))
                        ->get();

                    $normaleAssessments = $mod->assessments->filter(fn ($a) => ! str_contains(strtolower($a->type), 'rattrapage'));
                    $rattrapageAssessment = $mod->assessments->first(fn ($a) => str_contains(strtolower($a->type), 'rattrapage'));

                    $weightedSum = 0;
                    $totalWeight = 0;
                    foreach ($normaleAssessments as $a) {
                        $g = $studentGrades->firstWhere('assessment_id', $a->id);
                        if ($g) {
                            $val = $g->absent ? 0 : ($g->value !== null ? floatval($g->value) : null);
                            if ($val !== null) {
                                $weightedSum += $val * ($a->weight / 100);
                                $totalWeight += $a->weight;
                            }
                        }
                    }

                    $moyNormale = $totalWeight > 0 ? round($weightedSum * (100 / $totalWeight), 2) : 0;
                    $finalNote = $moyNormale;

                    $rGrade = $rattrapageAssessment ? $studentGrades->firstWhere('assessment_id', $rattrapageAssessment->id) : null;
                    if ($rGrade && ! $rGrade->absent && $rGrade->value !== null) {
                        $rVal = floatval($rGrade->value);
                        $finalNote = max($moyNormale, min(12.00, $rVal));
                    }

                    $modDecision = $finalNote >= 10.0 ? ($moyNormale >= 10.0 ? 'V' : 'VAR') : ($finalNote < 6.0 ? 'NV' : 'R');
                }

                if (LmdRules::isEliminatory($finalNote)) {
                    $hasEliminatory = true;
                }

                $modObj = [
                    'module_id' => $mod->id,
                    'code' => $mod->code,
                    'name' => $mod->name,
                    'semester_number' => $mod->semester_number,
                    'moy_normale' => $moyNormale,
                    'final_grade' => $finalNote,
                    'decision' => $modDecision,
                    'validation_year' => $validationYear,
                    'is_historical' => $isHistorical,
                ];

                $allModuleDetails[] = $modObj;
                $modulesDetailMap[$mod->id] = $modObj;
            }

            $oddModuleList = collect($allModuleDetails)->filter(fn ($m) => $m['semester_number'] == $oddSemNumber);
            $evenModuleList = collect($allModuleDetails)->filter(fn ($m) => $m['semester_number'] == $evenSemNumber);

            if ($oddModuleList->isEmpty()) {
                $oddModuleList = collect($allModuleDetails)->filter(fn ($m) => $m['semester_number'] % 2 !== 0);
            }
            if ($evenModuleList->isEmpty()) {
                $evenModuleList = collect($allModuleDetails)->filter(fn ($m) => $m['semester_number'] % 2 === 0);
            }

            $hasFraud = false;
            $fraudModules = [];

            // Check if student has any recorded fraud incidents in ExamIncident table
            $fraudIncidents = ExamIncident::where('student_id', $student->id)
                ->where(function ($q) {
                    $q->where('type', 'fraude')
                        ->orWhere('type', 'like', '%fraude%')
                        ->orWhere('description', 'like', '%fraude%');
                })
                ->with('exam.module')
                ->get();

            if ($fraudIncidents->isNotEmpty()) {
                $hasFraud = true;
                foreach ($fraudIncidents as $inc) {
                    $modCode = $inc->exam?->module?->code ?? 'Examen';
                    $fraudModules[] = $modCode;
                }
            }

            // Also check if any module in allModuleDetails has decision FRAUDE
            foreach ($allModuleDetails as $md) {
                if ($md['decision'] === 'FRAUDE' || (isset($md['is_fraud']) && $md['is_fraud'])) {
                    $hasFraud = true;
                    $fraudModules[] = $md['code'];
                }
            }

            $fraudModules = array_unique($fraudModules);

            $failedOdd = $oddModuleList->filter(fn ($m) => $m['final_grade'] < 10.00)->values();
            $failedEven = $evenModuleList->filter(fn ($m) => $m['final_grade'] < 10.00)->values();
            $eliminatoryMods = collect($allModuleDetails)->filter(fn ($m) => LmdRules::isEliminatory((float) $m['final_grade']))->map(fn ($m) => "{$m['code']} ({$m['final_grade']}/20)")->values()->toArray();

            $oddAvg = $oddModuleList->isNotEmpty() ? round($oddModuleList->avg('final_grade'), 2) : 0;
            $evenAvg = $evenModuleList->isNotEmpty() ? round($evenModuleList->avg('final_grade'), 2) : 0;
            $annualAvg = round(($oddAvg + $evenAvg) / 2, 2);

            $failedOddCount = $failedOdd->count();
            $failedEvenCount = $failedEven->count();

            $hasEliminatoryOdd = $oddModuleList->contains(fn ($m) => LmdRules::isEliminatory((float) $m['final_grade']));
            $hasEliminatoryEven = $evenModuleList->contains(fn ($m) => LmdRules::isEliminatory((float) $m['final_grade']));
            $hasEliminatory = $hasEliminatoryOdd || $hasEliminatoryEven;

            // 1. Semester Compensation S1 (Moyenne S1 >= 10.00 & pas de note < 5.0)
            $isOddCompensated = false;
            if ($oddAvg >= 10.00 && ! $hasEliminatoryOdd && ! $hasFraud) {
                $isOddCompensated = true;
                foreach ($allModuleDetails as &$md) {
                    if (($md['semester_number'] == $oddSemNumber || $md['semester_number'] % 2 !== 0) && $md['final_grade'] < 10.00) {
                        $md['decision'] = 'VPC';
                    }
                }
                unset($md);
            }

            // 2. Semester Compensation S2 (Moyenne S2 >= 10.00 & pas de note < 5.0)
            $isEvenCompensated = false;
            if ($evenAvg >= 10.00 && ! $hasEliminatoryEven && ! $hasFraud) {
                $isEvenCompensated = true;
                foreach ($allModuleDetails as &$md) {
                    if (($md['semester_number'] == $evenSemNumber || $md['semester_number'] % 2 === 0) && $md['final_grade'] < 10.00) {
                        $md['decision'] = 'VPC';
                    }
                }
                unset($md);
            }

            $failedTotal = $failedOddCount + $failedEvenCount;

            // 3. Annual Compensation S1+S2 (Moyenne Annuelle >= 10.00 & aucune note < 5.0 dans tout le bilan)
            $isAnnualCompensated = false;
            if ($annualAvg >= 10.00 && ! $hasEliminatory && ! $hasFraud && $failedTotal <= 2) {
                $isAnnualCompensated = true;
                foreach ($allModuleDetails as &$md) {
                    if ($md['final_grade'] < 10.00) {
                        $md['decision'] = 'VPC';
                    }
                }
                unset($md);
            }

            $oddDecision = match (true) {
                $hasFraud => 'FRAUDE',
                $oddAvg >= 10.00 && ! $hasEliminatoryOdd => ($oddModuleList->every(fn ($m) => $m['final_grade'] >= 10.0) ? 'V' : 'V.Comp'),
                $isAnnualCompensated => 'V.Comp',
                $failedOddCount <= 1 => 'PASS_DETTES',
                default => 'NV',
            };

            $evenDecision = match (true) {
                $hasFraud => 'FRAUDE',
                $evenAvg >= 10.00 && ! $hasEliminatoryEven => ($evenModuleList->every(fn ($m) => $m['final_grade'] >= 10.0) ? 'V' : 'V.Comp'),
                $isAnnualCompensated => 'V.Comp',
                $failedEvenCount <= 1 => 'PASS_DETTES',
                default => 'NV',
            };

            // Nouvelle Règle ENCG : Passage avec dettes (Réserviste) autorisé uniquement si au maximum 1 SEUL module non validé sur TOUTE L'ANNÉE.
            $decision = match (true) {
                $hasFraud => 'FRAUDE',
                ($oddAvg >= 10.00 && $evenAvg >= 10.00 && ! $hasEliminatoryOdd && ! $hasEliminatoryEven) || $isAnnualCompensated => ($annualAvg >= 10.0 && ! $isOddCompensated && ! $isEvenCompensated && ! $isAnnualCompensated ? 'V' : 'V.Comp'),
                $failedTotal <= 1 && $annualAvg >= 5.0 => 'PASS_DETTES',
                default => 'AJ',
            };

            $reasonParts = [];
            if ($hasFraud) {
                $modListStr = ! empty($fraudModules) ? implode(', ', $fraudModules) : 'Examen';
                $decisionReason = "Sanction Disciplinaire pour Fraude ({$modListStr}) — Non Compensable";
            } elseif ($decision === 'V') {
                $decisionReason = "Validation Directe du Bloc ({$oddSemNumber} & {$evenSemNumber})";
            } elseif ($decision === 'V.Comp') {
                $decisionReason = 'Validation par Compensation Annuelle (Pas de note < 5.0)';
            } elseif ($decision === 'PASS_DETTES') {
                $failedNames = collect($allModuleDetails)->filter(fn ($m) => $m['final_grade'] < 10.00)->pluck('code')->toArray();
                $modStr = ! empty($failedNames) ? implode(', ', $failedNames) : '';
                $decisionReason = "Passage avec Dettes (1 seul module NV dans l'année : {$modStr})";
            } else {
                if ($failedTotal > 1) {
                    $details = [];
                    if ($failedOddCount > 0) {
                        $details[] = "{$failedOddCount} mod. NV en S{$oddSemNumber}";
                    }
                    if ($failedEvenCount > 0) {
                        $details[] = "{$failedEvenCount} mod. NV en S{$evenSemNumber}";
                    }
                    $decisionReason = "Redoublement (Plus de 1 module non validé dans l'année [{$failedTotal} mod. NV] : ".implode(', ', $details).')';
                } else {
                    $decisionReason = "Redoublement (Moyenne Annuelle < 5.00 : {$annualAvg}/20)";
                }
            }

            $results[] = [
                'student_id' => $student->id,
                'student_name' => $student->user->name ?? $student->first_name.' '.$student->last_name,
                'cne' => $student->cne ?? $student->student_number,
                'cin' => $student->cin ?? $student->user?->cin ?? '',
                'year_level' => $yearLevel,
                'odd_semester_label' => "S{$oddSemNumber}",
                'even_semester_label' => "S{$evenSemNumber}",
                'odd_semester_avg' => round($oddAvg, 2),
                'even_semester_avg' => round($evenAvg, 2),
                'odd_semester_decision' => $hasFraud ? 'FRAUDE' : $oddDecision,
                'even_semester_decision' => $hasFraud ? 'FRAUDE' : $evenDecision,
                'annual_average' => $annualAvg,
                'has_eliminatory' => $hasEliminatory,
                'has_fraud' => $hasFraud,
                'failed_count_s1' => $failedOddCount,
                'failed_count_s2' => $failedEvenCount,
                'failed_total' => $failedOddCount + $failedEvenCount,
                'eliminatory_modules' => $eliminatoryMods,
                'decision_reason' => $decisionReason,
                'decision' => $decision,
                'modules_detail' => $allModuleDetails,
                'modules_map' => $modulesDetailMap,
            ];
        }

        return [
            'odd_semester_label' => "S{$oddSemNumber}",
            'even_semester_label' => "S{$evenSemNumber}",
            'modules' => $filiereModules->map(fn ($m) => [
                'id' => $m->id, 'code' => $m->code, 'name' => $m->name, 'semester_number' => $m->semester_number,
            ])->values()->toArray(),
            'students' => $results,
        ];
    }

    /**
     * Calculer le score d'un module à partir des notes.
     */
    private function calculateModuleScore($moduleGrades): float
    {
        $normalGrades = $moduleGrades->filter(fn ($g) => ! str_contains(strtolower($g->type ?? ''), 'rattrapage'));
        $rattrapageGrade = $moduleGrades->first(fn ($g) => str_contains(strtolower($g->type ?? ''), 'rattrapage'));

        $score = 0;
        foreach ($normalGrades as $g) {
            if (! $g->absent && $g->value !== null) {
                $score += ($g->value * ($g->weight / 100));
            }
        }

        if ($rattrapageGrade && ! $rattrapageGrade->absent && $rattrapageGrade->value !== null && $rattrapageGrade->value > $score) {
            $score = $rattrapageGrade->value;
        }

        return $score;
    }
}
