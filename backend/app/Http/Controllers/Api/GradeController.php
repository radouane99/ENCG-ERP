<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;
use App\Services\Academic\GradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GradeController extends Controller
{
    public function __construct(
        private GradeService $gradeService
    ) {}

    /**
     * Récupère les étudiants et leurs notes pour une évaluation.
     */
    public function getForAssessment(int $assessmentId, Request $request): JsonResponse
    {
        $assessment = Assessment::with('module')->findOrFail($assessmentId);
        $groupId = $request->query('group_id');
        $students = $this->gradeService->getRegisteredStudents($assessment->module, $groupId);
        $fraudIds = $this->gradeService->getFraudStudentIds($assessment->module);
        $isRattrapage = $this->gradeService->isRattrapageAssessment($assessment);
        $isSigned = $this->gradeService->isPvSigned($assessment->module_id);

        $signatureRecord = \App\Models\ModulePvSignature::where('module_id', $assessment->module_id)
            ->with('signer')->latest()->first();

        $data = $students->map(function ($student) use ($assessment, $fraudIds) {
            $grade = Grade::where('student_id', $student->id)
                ->where('assessment_id', $assessment->id)
                ->first();

            $hasFraud = $this->gradeService->isStudentFraud($student->id, $fraudIds);
            $isExam = $this->gradeService->isExamAssessment($assessment);
            $isFraud = $hasFraud && $isExam;

            return [
                'student_id'     => $student->id,
                'first_name'     => $student->first_name,
                'last_name'      => $student->last_name,
                'student_number' => $student->student_number,
                'apogee'         => $student->cne ?? $student->student_number,
                'value'          => $isFraud ? 0.0 : ($grade ? (float) $grade->value : null),
                'is_absent'      => $isFraud ? false : ($grade ? (bool) $grade->absent : false),
                'is_fraud'       => $isFraud,
            ];
        });

        return response()->json([
            'success'    => true,
            'data'       => $data,
            'is_locked'  => $isSigned,
            'signature'  => $signatureRecord ? [
                'signed_by'    => $signatureRecord->signer?->name ?? 'Enseignant',
                'signed_at'    => $signatureRecord->signed_at?->toIso8601String(),
                'digital_seal' => $signatureRecord->digital_seal,
            ] : null,
        ]);
    }

    /**
     * Enregistre les notes en masse.
     */
    public function storeBulk(Request $request, int $assessmentId): JsonResponse
    {
        $assessment = Assessment::with('module')->findOrFail($assessmentId);
        $user = $request->user();

        // Vérification verrouillage
        $lockMessage = $this->gradeService->isExamLocked($assessment);
        if ($lockMessage) {
            return response()->json(['message' => $lockMessage], 403);
        }

        $session = $this->gradeService->isRattrapageAssessment($assessment) ? 'rattrapage' : 'normale';
        $isAdmin = $user->hasAnyRole(['admin', 'institution_admin', 'super-admin']) || ($user->roles && $user->roles->contains('name', 'admin')) || !empty($user->is_admin);

        // Vérification professeur assigné (seulement si non-admin)
        if (!$isAdmin && $user->roles && $user->roles->pluck('name')->intersect(['professor', 'vacataire'])->isNotEmpty()) {
            if (!$this->gradeService->isProfessorAssignedToModule($user->id, $assessment->module_id)) {
                return response()->json(['message' => 'Vous n\'êtes pas assigné à ce module.'], 403);
            }
        }

        // Vérification PV signé pour cette session spécifique (pour les non-admins)
        if (!$isAdmin && $this->gradeService->isPvSigned($assessment->module_id, $session)) {
            return response()->json([
                'message' => "Le Procès-Verbal ({$session}) est déjà signé. La modification des notes est verrouillée."
            ], 403);
        }

        $validated = $request->validate([
            'grades'             => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.value'      => 'nullable|numeric|min:0|max:20',
            'grades.*.absent'     => 'boolean',
        ]);

        $fraudIds = $this->gradeService->getFraudStudentIds($assessment->module);
        $updatedCount = 0;

        foreach ($validated['grades'] as $gradeData) {
            $isFraud = $this->gradeService->isStudentFraud($gradeData['student_id'], $fraudIds)
                && $this->gradeService->isExamAssessment($assessment);

            $newValue = $isFraud ? 0.0 : ($gradeData['absent'] ? null : ($gradeData['value'] ?? null));
            $newAbsent = $isFraud ? false : ($gradeData['absent'] ?? false);

            // Audit
            $oldGrade = Grade::where('student_id', $gradeData['student_id'])
                ->where('assessment_id', $assessment->id)
                ->first();

            $this->logGradeChange($oldGrade, $newValue, $newAbsent, $gradeData['student_id'], $assessment, $request);

            Grade::updateOrCreate(
                [
                    'student_id'    => $gradeData['student_id'],
                    'assessment_id' => $assessment->id,
                ],
                [
                    'value'  => $newValue,
                    'absent' => $newAbsent,
                ]
            );

            $updatedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$updatedCount} notes enregistrées avec succès.",
        ]);
    }

    /**
     * PV de module avec calculs complets.
     */
    public function getModulePv(Request $request, int $moduleId): JsonResponse
    {
        $module = Module::with('assessments')->findOrFail($moduleId);
        $groupId = $request->query('group_id');
        $students = $this->gradeService->getRegisteredStudents($module, $groupId);
        $fraudIds = $this->gradeService->getFraudStudentIds($module);

        $normaleAssessments = $module->assessments->filter(
            fn($a) => !$this->gradeService->isRattrapageAssessment($a)
        );

        $rattrapageAssessment = $module->assessments->first(
            fn($a) => $this->gradeService->isRattrapageAssessment($a)
        );

        $data = $students->map(function ($student) use ($module, $normaleAssessments, $rattrapageAssessment, $fraudIds) {
            $isFraud = $this->gradeService->isStudentFraud($student->id, $fraudIds);

            // Charger toutes les notes de cet étudiant pour les évaluations du module
            $studentGrades = Grade::where('student_id', $student->id)
                ->whereIn('assessment_id', $module->assessments->pluck('id'))
                ->get();

            $gradesDetail = [];
            $gradesSimple = [];

            foreach ($module->assessments as $assessment) {
                $g = $studentGrades->firstWhere('assessment_id', $assessment->id);
                $gradeVal = $g ? ($g->absent ? null : (float) $g->value) : null;
                $isAbsent = $g ? (bool) $g->absent : false;

                $gradeObj = [
                    'value'     => $gradeVal,
                    'is_absent' => $isAbsent,
                ];

                $gradesDetail[$assessment->id] = $gradeObj;
                if ($assessment->type) {
                    $gradesDetail[$assessment->type] = $gradeObj;
                    $gradesDetail[strtolower($assessment->type)] = $gradeObj;
                    $gradesDetail[strtoupper($assessment->type)] = $gradeObj;
                }

                $gradesSimple[$assessment->id] = $gradeVal;
                if ($assessment->type) {
                    $gradesSimple[$assessment->type] = $gradeVal;
                    $gradesSimple[strtolower($assessment->type)] = $gradeVal;
                }
            }

            $moyenneNormale = $this->gradeService->calculateWeightedAverage($student, $normaleAssessments, $fraudIds);
            $decisionNormale = $this->gradeService->determineDecision($moyenneNormale);

            $rattrapageGradeVal = null;
            $rattrapageIsAbsent = false;
            $moyenneFinale = $moyenneNormale;
            $decisionFinale = $decisionNormale;

            if ($rattrapageAssessment && in_array($decisionNormale, ['R', 'NV'])) {
                $rGrade = $studentGrades->firstWhere('assessment_id', $rattrapageAssessment->id);

                if ($rGrade) {
                    $rattrapageGradeVal = $rGrade->value !== null ? (float) $rGrade->value : null;
                    $rattrapageIsAbsent = (bool) $rGrade->absent;

                    $moyenneRattrapage = $this->gradeService->calculateRattrapageAverage(
                        $student, $normaleAssessments, $rattrapageAssessment
                    );
                    $result = $this->gradeService->determineFinalRattrapageResult($moyenneNormale, $moyenneRattrapage);
                    $moyenneFinale = $result['moyenne_finale'];
                    $decisionFinale = $result['decision_finale'];
                }
            }

            if ($isFraud) {
                $moyenneNormale = 0.0;
                $decisionNormale = 'FRAUDE';
                $moyenneFinale = 0.0;
                $decisionFinale = 'FRAUDE';
            }

            return [
                'student_id'        => $student->id,
                'first_name'        => $student->first_name,
                'last_name'         => $student->last_name,
                'student_number'    => $student->student_number,
                'apogee'            => $student->cne ?? $student->student_number,
                'is_fraud'          => $isFraud,
                'grades_detail'     => $gradesDetail,
                'grades'            => $gradesSimple,
                'moyenne_normale'   => $moyenneNormale,
                'decision_normale'  => $decisionNormale,
                'rattrapage_note'   => $rattrapageGradeVal,
                'rattrapage_absent' => $rattrapageIsAbsent,
                'moyenne_finale'    => $moyenneFinale,
                'decision_finale'   => $decisionFinale,
            ];
        });

        $signature = $this->getPvSignature($moduleId);
        $analytics = $this->gradeService->calculateAnalytics($data);

        return response()->json([
            'success'     => true,
            'module'      => ['id' => $module->id, 'name' => $module->name, 'code' => $module->code],
            'assessments' => $module->assessments->map(fn($a) => [
                'id' => $a->id, 'type' => $a->type, 'weight' => $a->weight
            ]),
            'data'        => $data,
            'signature'   => $signature,
            'analytics'   => $analytics,
        ]);
    }

    /**
     * Signe le PV et génère les éligibilités rattrapage.
     */
    public function signModulePv(Request $request, int $moduleId): JsonResponse
    {
        $validated = $request->validate([
            'group_id'       => 'nullable',
            'session'        => 'nullable|string|in:normale,rattrapage,totale',
            'signature_data' => 'nullable|string',
        ]);

        $module = Module::with('assessments')->findOrFail($moduleId);
        $user = $request->user();
        $session = $validated['session'] ?? 'normale';
        $groupId = $validated['group_id'] ?? null;

        $digitalSeal = hash('sha256', "module:{$moduleId}|session:{$session}|signer:{$user->id}|ts:" . now()->timestamp);

        // Signature
        \App\Models\ModulePvSignature::updateOrCreate(
            ['module_id' => $moduleId, 'group_id' => $groupId, 'session' => $session],
            [
                'signed_by'      => $user->id,
                'signed_at'      => now(),
                'signature_data' => $validated['signature_data'] ?? null,
                'ip_address'     => $request->ip(),
                'digital_seal'   => $digitalSeal,
            ]
        );

        // Génération éligibilités rattrapage
        $students = $this->gradeService->getRegisteredStudents($module, $groupId);
        $normaleAssessments = $module->assessments->filter(
            fn($a) => !$this->gradeService->isRattrapageAssessment($a)
        );

        $result = $this->gradeService->generateRattrapageEligibilities($module, $students, $normaleAssessments);

        return response()->json([
            'success'      => true,
            'message'      => 'PV signé avec succès. Éligibilités rattrapage générées.',
            'digital_seal' => $digitalSeal,
            'created'      => $result['created'],
            'updated'      => $result['updated'],
        ]);
    }

    // ─── MÉTHODES COURTES ─────────────────────────────────────

    public function generateRattrapageEligibilities(Request $request, int $moduleId): JsonResponse
    {
        $module = Module::with('assessments')->findOrFail($moduleId);
        $groupId = $request->input('group_id');
        $students = $this->gradeService->getRegisteredStudents($module, $groupId);
        $normaleAssessments = $module->assessments->filter(
            fn($a) => !$this->gradeService->isRattrapageAssessment($a)
        );

        $result = $this->gradeService->generateRattrapageEligibilities($module, $students, $normaleAssessments);

        return response()->json([
            'success' => true,
            'message' => "{$result['created']} créées, {$result['updated']} mises à jour.",
            'created' => $result['created'],
            'updated' => $result['updated'],
        ]);
    }

    public function getModuleAuditLogs(int $moduleId): JsonResponse
    {
        $module = Module::findOrFail($moduleId);

        $logs = \Spatie\Activitylog\Models\Activity::where(function ($query) use ($module) {
            $query->where('description', 'like', "%{$module->code}%")
                  ->orWhere('description', 'like', "%{$module->name}%");
        })
        ->latest()
        ->take(30)
        ->get()
        ->map(fn($log) => [
            'id'          => $log->id,
            'description' => $log->description,
            'causer_name' => $log->causer?->name ?? 'Système',
            'created_at'  => $log->created_at->toIso8601String(),
        ]);

        return response()->json(['success' => true, 'data' => $logs]);
    }

    public function sendTranscriptEmail(Request $request, int $studentId): JsonResponse
    {
        $student = Student::with('user')->findOrFail($studentId);

        if (!$student->user?->email) {
            return response()->json(['success' => false, 'message' => 'Email introuvable.'], 400);
        }

        try {
            \Illuminate\Support\Facades\Mail::to($student->user->email)->send(
                new \App\Mail\StudentTranscriptMail($student->user->name, 'Session 2025/2026')
            );
            return response()->json(['success' => true, 'message' => 'Email envoyé.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getProgressSummary(): JsonResponse
    {
        $modules = Module::with(['assessments', 'professors.user'])->get();
        $pendingList = [];
        $completedModules = 0;

        foreach ($modules as $mod) {
            $totalAssessments = $mod->assessments->count();
            if ($totalAssessments === 0) continue;

            $filledAssessments = 0;
            foreach ($mod->assessments as $ass) {
                if (Grade::where('assessment_id', $ass->id)->exists()) {
                    $filledAssessments++;
                }
            }

            $progress = round(($filledAssessments / $totalAssessments) * 100);

            if ($progress >= 100) {
                $completedModules++;
            } else {
                $profNames = $mod->professors->map(fn($p) => $p->user?->name)->implode(', ');
                $pendingList[] = [
                    'module_id'  => $mod->id,
                    'code'       => $mod->code,
                    'name'       => $mod->name,
                    'progress'   => $progress,
                    'professors' => $profNames ?: 'Non assigné',
                ];
            }
        }

        return response()->json([
            'success'            => true,
            'total_modules'      => $modules->count(),
            'completed_modules'  => $completedModules,
            'overall_progress'   => $modules->count() > 0 ? round(($completedModules / $modules->count()) * 100) : 0,
            'pending_modules'    => $pendingList,
        ]);
    }

    public function auditGradeDistribution(Request $request, int $moduleId): JsonResponse
    {
        $pvResponse = $this->getModulePv($request, $moduleId);
        $pvData = json_decode($pvResponse->getContent(), true);
        $analytics = $pvData['analytics'] ?? [];

        $moyenne = floatval($analytics['avg'] ?? 10);
        $tauxReussite = floatval($analytics['pass_rate'] ?? 50);

        $insights = [];
        if ($tauxReussite >= 75) {
            $insights[] = "Excellente assimilation globale.";
        } elseif ($tauxReussite < 40) {
            $insights[] = "Alerte : Taux de réussite anormalement bas (<40%).";
        } else {
            $insights[] = "Distribution équilibrée conforme à la courbe gaussienne.";
        }

        return response()->json([
            'success'            => true,
            'module_id'          => $moduleId,
            'moyenne_promotion'  => $moyenne,
            'taux_reussite'      => $tauxReussite,
            'anomalies_detected' => $tauxReussite < 40 || $moyenne < 9.0,
            'insights'           => $insights,
        ]);
    }

    // ─── HELPERS PRIVÉS ───────────────────────────────────────

    private function getPvSignature(int $moduleId): ?array
    {
        $sigRecord = \App\Models\ModulePvSignature::where('module_id', $moduleId)
            ->with('signer')->latest()->first();

        if (!$sigRecord) return null;

        return [
            'signed_by'      => $sigRecord->signer?->name ?? 'Enseignant',
            'signed_at'      => $sigRecord->signed_at?->toIso8601String(),
            'signature_data' => $sigRecord->signature_data,
            'ip_address'     => $sigRecord->ip_address,
            'digital_seal'   => $sigRecord->digital_seal,
        ];
    }

    private function logGradeChange(
        ?Grade $oldGrade,
        ?float $newValue,
        bool $newAbsent,
        int $studentId,
        Assessment $assessment,
        Request $request
    ): void {
        $changed = false;
        $oldValDesc = 'Néant';

        if (!$oldGrade) {
            if ($newValue !== null || $newAbsent) $changed = true;
        } else {
            if ($oldGrade->value != $newValue || $oldGrade->absent != $newAbsent) {
                $changed = true;
                $oldValDesc = $oldGrade->absent ? 'ABI' : ($oldGrade->value . '/20');
            }
        }

        if (!$changed || !class_exists('Spatie\Activitylog\Models\Activity')) return;

        $student = Student::with('user')->find($studentId);
        $newValDesc = $newAbsent ? 'ABI' : ($newValue . '/20');
        $userName = $request->user()?->name ?? 'Système';

        activity()
            ->performedOn($assessment)
            ->event('grade_modified')
            ->withProperties([
                'student' => $student->last_name . ' ' . $student->first_name,
                'old_value' => $oldValDesc,
                'new_value' => $newValDesc,
                'ip' => $request->ip(),
                'author' => $userName,
            ])
            ->log("Note modifiée : {$oldValDesc} -> {$newValDesc} par {$userName}");
    }

    /**
     * Get consolidated Semester PV matrix for all 7 modules of a semester
     */
    public function getSemesterPv(Request $request): JsonResponse
    {
        $filiereId = intval($request->query('filiere_id', 1));
        $semester = intval($request->query('semester', 1));
        $groupId = $request->query('group_id');
        $session = $request->query('session', 'normale');

        $filiere = \App\Models\Filiere::find($filiereId);
        $modules = \App\Models\Module::where('filiere_id', $filiereId)
            ->where('semester_number', $semester)
            ->with('assessments')
            ->orderBy('id')
            ->get();

        if ($modules->isEmpty()) {
            $modules = \App\Models\Module::where('filiere_id', $filiereId)->take(7)->get();
        }

        $academicYear = \App\Models\AcademicYear::where('is_current', true)->first()
            ?? \App\Models\AcademicYear::first();

        $regQuery = \App\Models\StudentRegistration::where('filiere_id', $filiereId)
            ->where('academic_year_id', $academicYear?->id ?? 1);

        if ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''], true)) {
            $regQuery->where('group_id', intval($groupId));
        }

        $registrations = $regQuery->with(['student.user'])->get();

        $studentsData = [];
        $totalValids = 0;
        $totalRattrapages = 0;
        $totalElimines = 0;

        foreach ($registrations as $reg) {
            $student = $reg->student;
            if (!$student) continue;

            $moduleGrades = [];
            $sumMoyennes = 0;
            $countModules = 0;
            $hasEliminatoire = false;
            $hasRattrapageModule = false;
            $hasVarModule = false;

            foreach ($modules as $mod) {
                $normaleAssessments = $mod->assessments->filter(fn($a) => strtolower(trim($a->type)) !== 'rattrapage');
                $rattrapageAssessment = $mod->assessments->first(fn($a) => strtolower(trim($a->type)) === 'rattrapage');

                $studentGrades = \App\Models\Grade::where('student_id', $student->id)
                    ->whereIn('assessment_id', $mod->assessments->pluck('id'))
                    ->get();

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

                $moyNormale = $totalWeight > 0 ? round($weightedSum * (100 / $totalWeight), 2) : null;
                
                $rattrapageGrade = $rattrapageAssessment 
                    ? $studentGrades->firstWhere('assessment_id', $rattrapageAssessment->id) 
                    : null;

                $rVal = null;
                if ($rattrapageGrade && !$rattrapageGrade->absent && $rattrapageGrade->value !== null) {
                    $rVal = floatval($rattrapageGrade->value);
                }

                $finalModNote = $moyNormale;
                $modDecision = 'NV';

                if ($rVal !== null && $session !== 'normale') {
                    $rCappedExam = min(10.00, $rVal);
                    $newSum = 0;
                    $newW = 0;
                    $examA = $normaleAssessments->first(fn($a) => str_contains(strtolower($a->type), 'exam'));
                    foreach ($normaleAssessments as $a) {
                        $g = $studentGrades->firstWhere('assessment_id', $a->id);
                        $val = ($a->id === $examA?->id) ? $rCappedExam : ($g ? ($g->absent ? 0 : floatval($g->value ?? 0)) : 0);
                        $newSum += $val * ($a->weight / 100);
                        $newW += $a->weight;
                    }
                    $rMoy = $newW > 0 ? round($newSum * (100 / $newW), 2) : 0;
                    $finalModNote = max($moyNormale ?? 0, min(10.00, $rMoy));
                }

                if ($finalModNote !== null) {
                    if ($finalModNote >= 10.00) {
                        $modDecision = ($moyNormale !== null && $moyNormale >= 10.00) ? 'V' : 'VAR';
                        if ($modDecision === 'VAR') $hasVarModule = true;
                    } else {
                        $modDecision = 'NV';
                        $hasRattrapageModule = true;
                    }

                    if ($finalModNote < 6.00) {
                        $hasEliminatoire = true;
                    }

                    $sumMoyennes += $finalModNote;
                    $countModules++;
                }

                // Check if student has a historical validation for this module from previous years
                $histVal = \App\Models\ModuleValidation::where('student_id', $student->id)
                    ->where('module_id', $mod->id)
                    ->first();

                $isHistorical = false;
                $validationYear = $academicYear?->name ?? '2026/2027';

                if ($histVal && floatval($histVal->final_grade) >= 10.00) {
                    $finalModNote = floatval($histVal->final_grade);
                    $modDecision = 'V';
                    $isHistorical = true;
                    $validationYear = '2025/2026';
                }

                $moduleGrades[$mod->id] = [
                    'module_id' => $mod->id,
                    'module_code' => $mod->code,
                    'module_name' => $mod->name,
                    'note' => $finalModNote,
                    'moy_normale' => $moyNormale,
                    'rattrapage' => $rVal,
                    'decision' => $modDecision,
                    'validation_year' => $validationYear,
                    'is_historical' => $isHistorical,
                ];

            }

            $moyenneSemestrielle = $countModules > 0 ? round($sumMoyennes / $countModules, 2) : null;

            // ENCG Compensation Rule: Max 2 weak modules (<10) allowed for compensation eligibility
            $weakModulesCount = 0;
            foreach ($moduleGrades as $mInfo) {
                if ($mInfo['note'] !== null && $mInfo['note'] < 10.00) {
                    $weakModulesCount++;
                }
            }

            $canCompensate = ($weakModulesCount <= 2);
            $decisionGlobal = 'NV';
            $isSemesterValidated = ($moyenneSemestrielle !== null && $moyenneSemestrielle >= 10.00 && !$hasEliminatoire && $canCompensate);

            if ($isSemesterValidated) {
                $decisionGlobal = $hasVarModule ? 'VAR' : 'V';
                $totalValids++;

                // Apply Compensation code VPC to the weak modules (6.00 <= note < 10.00)
                foreach ($moduleGrades as $mId => &$mInfo) {
                    if ($mInfo['note'] !== null && $mInfo['note'] >= 6.00 && $mInfo['note'] < 10.00) {
                        $mInfo['decision'] = 'VPC'; // Validé Par Compensation
                    }
                }
                unset($mInfo);
            } elseif ($hasRattrapageModule || ($moyenneSemestrielle !== null && $moyenneSemestrielle < 10) || !$canCompensate) {
                $decisionGlobal = 'RAT';
                $totalRattrapages++;
            } else {
                $totalElimines++;
            }

            $validatedCreditsCount = count(array_filter($moduleGrades, fn($m) => in_array($m['decision'], ['V', 'VAR', 'VPC', 'VC'])));

            $studentsData[] = [
                'student_id' => $student->id,
                'student_number' => $student->student_number,
                'apogee' => $student->cne_cme ?? $student->student_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'module_grades' => $moduleGrades,
                'moyenne_semestrielle' => $moyenneSemestrielle,
                'has_eliminatoire' => $hasEliminatoire,
                'decision_global' => $decisionGlobal,
                'credits' => $validatedCreditsCount,
            ];

        }

        return response()->json([
            'filiere' => $filiere ? ['id' => $filiere->id, 'name' => $filiere->name, 'code' => $filiere->code] : null,
            'semester' => $semester,
            'session' => $session,
            'modules' => $modules->map(fn($m) => ['id' => $m->id, 'code' => $m->code, 'name' => $m->name, 'coefficient' => $m->coefficient ?? 1]),
            'students' => $studentsData,
            'stats' => [
                'total_students' => count($studentsData),
                'valids' => $totalValids,
                'rattrapages' => $totalRattrapages,
                'elimines' => $totalElimines,
                'success_rate' => count($studentsData) > 0 ? round(($totalValids / count($studentsData)) * 100, 1) : 0,
            ]
        ]);
    }
}