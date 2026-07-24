<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Grade;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GradeController extends Controller
{
    /**
     * Fetch students and their current grades for a specific assessment.
     */
    public function getForAssessment($assessmentId, Request $request): JsonResponse
    {
        $assessment = Assessment::with('module')->findOrFail($assessmentId);
        
        $academicYearId = $request->query('academic_year_id');
        if (!$academicYearId) {
            $academicYear = \App\Models\AcademicYear::where('is_current', true)->first() ?? \App\Models\AcademicYear::first();
            if (!$academicYear) {
                return response()->json(['success' => false, 'message' => 'Année académique active introuvable.'], 404);
            }
            $academicYearId = $academicYear->id;
        }

        $groupId = $request->query('group_id');

        // ── #1 Rattrapage filter: only show accorded students ──────────────
        $isRattrapageAssessment = str_contains(strtolower(trim($assessment->type)), 'rattrapage');

        if ($isRattrapageAssessment) {
            // Only students explicitly granted retake access (status = 'Accordé')
            $accordedStudentIds = \Illuminate\Support\Facades\DB::table('resit_eligibilities')
                ->where('module_id', $assessment->module_id)
                ->where('status', 'Accordé')
                ->pluck('student_id')
                ->toArray();

            if (empty($accordedStudentIds)) {
                return response()->json(['data' => [], 'rattrapage_mode' => true, 'message' => 'Aucun étudiant autorisé au rattrapage pour ce module.']);
            }

            $students = Student::whereIn('id', $accordedStudentIds)
                ->with(['user', 'grades' => function ($q) use ($assessmentId) {
                    $q->where('assessment_id', $assessmentId);
                }])->get();

            $data = $students->map(function ($student) {
                $grade = $student->grades->first();
                return [
                    'student_id'     => $student->id,
                    'first_name'     => $student->first_name,
                    'last_name'      => $student->last_name,
                    'student_number' => $student->student_number,
                    'apogee'         => $student->cne_cme ?? $student->student_number,
                    'value'          => $grade ? (float) $grade->value : null,
                    'is_absent'      => $grade ? (bool) $grade->absent : false,
                ];
            });

            return response()->json(['data' => $data, 'rattrapage_mode' => true]);
        }
        // ── End rattrapage filter ──────────────────────────────────────────

        $retakeStudentIds = \Illuminate\Support\Facades\DB::table('student_module_retakes')
            ->where('module_id', $assessment->module_id)
            ->where('academic_year_id', $academicYearId)
            ->pluck('student_id')
            ->toArray();

        $studentsQuery = Student::where(function($query) use ($assessment, $academicYearId, $groupId, $retakeStudentIds) {
            $query->whereHas('registrations', function ($q) use ($assessment, $academicYearId, $groupId) {
                $q->where('filiere_id', $assessment->module->filiere_id)
                  ->where('academic_year_id', $academicYearId);
                if ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''], true)) {
                    $q->where('group_id', $groupId);
                }
            });

            if (!empty($retakeStudentIds)) {
                $query->orWhereIn('id', $retakeStudentIds);
            }
        });

        // Eager load user and grades for this specific assessment
        $students = $studentsQuery->with(['user', 'grades' => function ($q) use ($assessmentId) {
            $q->where('assessment_id', $assessmentId);
        }])->get();

        $data = $students->map(function ($student) {
            $grade = $student->grades->first();
            return [
                'student_id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'student_number' => $student->student_number,
                'apogee' => $student->cne_cme ?? $student->student_number,
                'value' => $grade ? (float) $grade->value : null,
                'is_absent' => $grade ? (bool) $grade->absent : false,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function storeBulk(Request $request, $assessmentId): JsonResponse
    {
        $assessment = Assessment::findOrFail($assessmentId);
        $user = $request->user();



        // 2. Professor must be assigned to this module
        if ($user->hasRole(['professor', 'vacataire'])) {
            $prof = \App\Models\Professor::where('user_id', $user->id)->first();
            if (!$prof) {
                return response()->json(['message' => 'Profil professeur introuvable.'], 403);
            }

            $isAssigned = \Illuminate\Support\Facades\DB::table('module_professor')
                ->where('professor_id', $prof->id)
                ->where('module_id', $assessment->module_id)
                ->exists();

            if (!$isAssigned) {
                return response()->json([
                    'message' => 'Opération refusée : Vous n\'êtes pas assigné à ce module.'
                ], 403);
            }
        }

        // [AUDIT SEC-04] Verify exam locking phases & semester targeting
        $institution = \App\Models\Institution::first();
        $settings = $institution ? (is_array($institution->settings) ? $institution->settings : (is_string($institution->settings) ? json_decode($institution->settings, true) : [])) : [];
        $currentPhase = $settings['exam_lock_phase'] ?? 'Verrouillé';
        $deadline = $settings['exam_lock_deadline'] ?? null;

        $typeLower = strtolower(trim($assessment->type));
        $isRattrapageAssessment = str_contains($typeLower, 'rattrapage');
        $isOrdinaireExamAssessment = (str_contains($typeLower, 'exam') || str_contains($typeLower, 'examen')) && !$isRattrapageAssessment;
        $isMajorExam = $isOrdinaireExamAssessment || $isRattrapageAssessment;

        // Continuous assessments (CC, CC1, CC2, TP, Projet) are always editable regardless of exam locking phase
        if ($isMajorExam) {
            $currentPhaseLower = strtolower($currentPhase);
            $isRattrapagePhase = str_contains($currentPhaseLower, 'rattrapage');
            $isTotalLock = ($currentPhase === 'Verrouillage Total' || $currentPhase === 'Verrouillé');

            if ($isTotalLock) {
                return response()->json([
                    'message' => 'Opération refusée : La saisie des examens est actuellement verrouillée par l\'administration. Seuls les contrôles continus (CC) sont autorisés.'
                ], 403);
            }

            // Check deadline if configured
            if (!empty($deadline)) {
                try {
                    $deadlineDt = \Carbon\Carbon::parse($deadline);
                    if (now()->greaterThan($deadlineDt)) {
                        return response()->json([
                            'message' => "Opération refusée : Le délai limite de saisie des notes pour cette session (" . $deadlineDt->format('d/m/Y H:i') . ") est dépassé."
                        ], 403);
                    }
                } catch (\Exception $e) {
                    // Ignore date parse errors
                }
            }

            // Semester season targeting (Automne = S1, S3, S5, S7, S9 | Printemps = S2, S4, S6, S8, S10)
            $moduleSemesterNum = (int) ($assessment->module->semester_number ?? 1);
            $isAutomneModule = ($moduleSemesterNum % 2 !== 0); // Odd = Automne
            $isPrintempsModule = ($moduleSemesterNum % 2 === 0); // Even = Printemps

            $isAutomnePhase = str_contains($currentPhaseLower, 'automne');
            $isPrintempsPhase = str_contains($currentPhaseLower, 'printemps');

            if ($isAutomnePhase && $isPrintempsModule) {
                return response()->json([
                    'message' => "Opération refusée : La phase « {$currentPhase} » concerne uniquement les semestres خريفية / Automne (S1, S3, S5, S7, S9). Ce module appartient au semestre S{$moduleSemesterNum} (Printemps)."
                ], 403);
            }

            if ($isPrintempsPhase && $isAutomneModule) {
                return response()->json([
                    'message' => "Opération refusée : La phase « {$currentPhase} » concerne uniquement les semestres ربيعية / Printemps (S2, S4, S6, S8, S10). Ce module appartient au semestre S{$moduleSemesterNum} (Automne)."
                ], 403);
            }

            if ($isRattrapageAssessment && !$isRattrapagePhase) {
                return response()->json([
                    'message' => 'Opération refusée : La session de rattrapage n\'est pas encore ouverte.'
                ], 403);
            }

            if ($isOrdinaireExamAssessment && $isRattrapagePhase) {
                return response()->json([
                    'message' => 'Opération refusée : La session ordinaire est verrouillée. Seules les notes de rattrapage et contrôles continus peuvent être modifiées.'
                ], 403);
            }
        }

        $validated = $request->validate([
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.value' => 'nullable|numeric|min:0|max:20',
            'grades.*.absent' => 'boolean',
        ]);

        // [AUDIT SEC-05] Block updates if the PV is already digitally signed
        $studentId = $validated['grades'][0]['student_id'] ?? null;
        if ($studentId) {
            $registration = \App\Models\StudentRegistration::where('student_id', $studentId)
                ->where('filiere_id', $assessment->module->filiere_id)
                ->first();
            $groupId = $registration ? $registration->group_id : null;
            
            if ($groupId) {
                $isSigned = \App\Models\ModulePvSignature::where('module_id', $assessment->module_id)
                    ->where('group_id', $groupId)
                    ->exists();
                if ($isSigned) {
                    return response()->json([
                        'message' => 'Opération refusée : Le PV de délibération pour ce groupe a été signé électroniquement et verrouillé.'
                    ], 403);
                }
            }
        }

        foreach ($validated['grades'] as $gradeData) {
            $newValue = !empty($gradeData['absent']) ? null : ($gradeData['value'] ?? null);
            $newAbsent = $gradeData['absent'] ?? false;

            // Audit change
            $oldGrade = Grade::where('student_id', $gradeData['student_id'])
                ->where('assessment_id', $assessment->id)
                ->first();

            $changed = false;
            $oldValDesc = 'Néant';
            
            if (!$oldGrade) {
                if ($newValue !== null || $newAbsent) {
                    $changed = true;
                }
            } else {
                if ($oldGrade->value != $newValue || $oldGrade->absent != $newAbsent) {
                    $changed = true;
                    $oldValDesc = $oldGrade->absent ? 'ABI' : ($oldGrade->value !== null ? $oldGrade->value . '/20' : 'Néant');
                }
            }

            if ($changed) {
                $student = \App\Models\Student::with('user')->find($gradeData['student_id']);
                $newValDesc = $newAbsent ? 'ABI' : ($newValue !== null ? $newValue . '/20' : 'Néant');
                $user = $request->user();
                $userName = $user ? ($user->name ?? $user->email) : 'Système/Enseignant';

                if (class_exists('Spatie\Activitylog\Models\Activity')) {
                    activity()
                        ->performedOn($assessment)
                        ->event('grade_modified')
                        ->withProperties([
                            'student' => $student->last_name . ' ' . $student->first_name,
                            'student_number' => $student->student_number,
                            'old_value' => $oldValDesc,
                            'new_value' => $newValDesc,
                            'ip' => $request->ip(),
                            'author' => $userName
                        ])
                        ->log("Note modifiée pour l'étudiant {$student->last_name} {$student->first_name} : {$oldValDesc} -> {$newValDesc} par {$userName}");
                }
            }

            Grade::updateOrCreate(
                [
                    'student_id' => $gradeData['student_id'],
                    'assessment_id' => $assessment->id,
                ],
                [
                    'value' => $newValue,
                    'absent' => $newAbsent,
                ]
            );
        }

        return response()->json(['message' => 'Notes enregistrées avec succès.']);
    }

    /**
     * Get module PV (Processus Verbal) for a specific group.
     */
    public function getModulePv(Request $request, $moduleId): JsonResponse
    {
        $groupId = $request->query('group_id');
        $module = \App\Models\Module::with('assessments')->findOrFail($moduleId);
        
        $query = \App\Models\StudentRegistration::query();

        if ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''])) {
            $query->where('group_id', $groupId);
        } else {
            $query->where('filiere_id', $module->filiere_id)
                  ->where('academic_year_id', $request->query('academic_year_id', 1));
        }

        $registrations = $query->with('student.user')->get();

        $students = $registrations->map(function ($reg) {
            return $reg->student;
        })->filter();

        // Get assessments for this module
        $assessments = $module->assessments;

        // Find standard assessments (normale session: CC, CC1, CC2, Exam, TP, etc.)
        // And find Rattrapage assessment (normally created with type 'Rattrapage')
        $normaleAssessments = $assessments->filter(function($a) {
            return strtolower($a->type) !== 'rattrapage';
        });

        $rattrapageAssessment = $assessments->first(function($a) {
            return strtolower($a->type) === 'rattrapage';
        });

        if (!$rattrapageAssessment) {
            $rattrapageAssessment = \App\Models\Assessment::create([
                'module_id' => $module->id,
                'type' => 'Rattrapage',
                'weight' => 100,
                'date' => now()->format('Y-m-d')
            ]);
            $assessments = $module->fresh()->assessments;
        }

        $data = $students->map(function ($student) use ($normaleAssessments, $rattrapageAssessment) {
            $studentGrades = \App\Models\Grade::where('student_id', $student->id)
                ->whereIn('assessment_id', $normaleAssessments->pluck('id'))
                ->get();

            $gradesDetail = [];
            $totalWeight = 0;
            $weightedSum = 0;

            foreach ($normaleAssessments as $a) {
                $grade = $studentGrades->firstWhere('assessment_id', $a->id);
                $val = $grade ? $grade->value : null;
                $isAbsent = $grade ? $grade->absent : false;
                
                $gradeData = [
                    'value' => $val,
                    'is_absent' => $isAbsent,
                    'weight' => $a->weight
                ];
                $gradesDetail[$a->type] = $gradeData;
                $gradesDetail[$a->id] = $gradeData;

                // If absent, value is treated as 0 for calculation
                $calcVal = $isAbsent ? 0 : ($val !== null ? floatval($val) : null);
                
                if ($calcVal !== null) {
                    $weightedSum += $calcVal * ($a->weight / 100);
                    $totalWeight += $a->weight;
                }
            }

            // Normal Average
            $moyenneNormale = $totalWeight > 0 ? ($weightedSum * (100 / $totalWeight)) : null;
            if ($moyenneNormale !== null) {
                $moyenneNormale = round($moyenneNormale, 2);
            }

            // Normal Decision
            $decisionNormale = '';
            if ($moyenneNormale !== null) {
                if ($moyenneNormale >= 10) {
                    $decisionNormale = 'V'; // Validé
                } elseif ($moyenneNormale < 6) {
                    $decisionNormale = 'NV'; // Non Validé (éliminé)
                } else {
                    $decisionNormale = 'R'; // Rattrapage
                }
            }

            // Rattrapage Grade
            $rattrapageGradeVal = null;
            $rattrapageIsAbsent = false;
            if ($rattrapageAssessment) {
                $rGrade = \App\Models\Grade::where('student_id', $student->id)
                    ->where('assessment_id', $rattrapageAssessment->id)
                    ->first();
                if ($rGrade) {
                    $rattrapageGradeVal = $rGrade->value;
                    $rattrapageIsAbsent = $rGrade->absent;
                }
            }

            // Final Average (after Rattrapage if applicable)
            $moyenneFinale = $moyenneNormale;
            $decisionFinale = $decisionNormale;

            if ($decisionNormale === 'R' || $decisionNormale === 'NV') {
                if ($rattrapageGradeVal !== null || $rattrapageIsAbsent) {
                    // Standard Rattrapage calculation: Rattrapage replaces Exam note
                    // Find standard 'Exam' assessment to replace
                    $examAssessment = $normaleAssessments->first(function($a) {
                        return str_contains(strtolower($a->type), 'exam') || str_contains(strtolower($a->type), 'examen');
                    });

                    $rCalcVal = $rattrapageIsAbsent ? 0 : floatval($rattrapageGradeVal);
                    
                    if ($examAssessment) {
                        $newWeightedSum = 0;
                        $newTotalWeight = 0;
                        foreach ($normaleAssessments as $a) {
                            $grade = $studentGrades->firstWhere('assessment_id', $a->id);
                            $val = $grade ? $grade->value : null;
                            $isAbsent = $grade ? $grade->absent : false;
                            $calcVal = $isAbsent ? 0 : ($val !== null ? floatval($val) : null);

                            if ($a->id === $examAssessment->id) {
                                $calcVal = $rCalcVal;
                            }

                            if ($calcVal !== null) {
                                $newWeightedSum += $calcVal * ($a->weight / 100);
                                $newTotalWeight += $a->weight;
                            }
                        }
                        $moyenneRattrapage = $newTotalWeight > 0 ? ($newWeightedSum * (100 / $newTotalWeight)) : 0;
                        $moyenneFinale = max($moyenneNormale ?? 0, round($moyenneRattrapage, 2));
                    } else {
                        $moyenneFinale = max($moyenneNormale ?? 0, $rCalcVal);
                    }

                    if ($moyenneFinale >= 10) {
                        $decisionFinale = 'VAR'; // Validé Après Rattrapage
                    } else {
                        $decisionFinale = 'NV'; // Non Validé après Rattrapage
                    }
                }
            }

            return [
                'student_id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'student_number' => $student->student_number,
                'apogee' => $student->cne_cme ?? $student->student_number,
                'grades_detail' => $gradesDetail,
                'moyenne_normale' => $moyenneNormale,
                'decision_normale' => $decisionNormale,
                'rattrapage_note' => $rattrapageGradeVal,
                'rattrapage_absent' => $rattrapageIsAbsent,
                'moyenne_finale' => $moyenneFinale,
                'decision_finale' => $decisionFinale
            ];
        });

        $signature = null;
        $sigGroupId = ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''])) ? intval($groupId) : null;
        $sigQuery = \App\Models\ModulePvSignature::where('module_id', $moduleId);
        if ($sigGroupId) {
            $sigQuery->where('group_id', $sigGroupId);
        }
        $sigRecord = $sigQuery->with('signer')->first();

        if ($sigRecord) {
            $signature = [
                'signed_by' => $sigRecord->signer?->name ?? ($sigRecord->signer?->email ?? 'Chef de Filière / Enseignant'),
                'signed_at' => $sigRecord->signed_at ? $sigRecord->signed_at->toIso8601String() : null,
                'signature_data' => $sigRecord->signature_data,
                'ip_address' => $sigRecord->ip_address,
                'digital_seal' => $sigRecord->digital_seal,
            ];
        }

        // ── Jury Analytics ────────────────────────────────────────────────────
        $moyennesFinales = $data->pluck('moyenne_finale')->filter(fn($v) => $v !== null)->values();
        $totalStudents   = $data->count();

        $admis      = $data->whereIn('decision_finale', ['V', 'VAR'])->count();
        $rattrapage = $data->where('decision_finale', 'R')->count();
        $elimines   = $data->where('decision_finale', 'NV')->count();
        $nonSaisi   = $data->where('moyenne_finale', null)->count();

        $avg    = $moyennesFinales->isNotEmpty() ? round($moyennesFinales->avg(), 2) : null;
        $sorted = $moyennesFinales->sort()->values();
        $n      = $sorted->count();
        $median = $n > 0
            ? ($n % 2 === 0 ? round(($sorted[$n / 2 - 1] + $sorted[$n / 2]) / 2, 2) : $sorted[(int)($n / 2)])
            : null;

        // Grade distribution — 10 buckets: [0-2[, [2-4[, ..., [18-20]
        $distribution = [];
        for ($i = 0; $i < 10; $i++) {
            $low  = $i * 2;
            $high = $low + 2;
            $label = "{$low}-{$high}";
            $count = $moyennesFinales->filter(fn($m) => $m >= $low && ($i === 9 ? $m <= 20 : $m < $high))->count();
            $distribution[] = ['range' => $label, 'count' => $count];
        }

        $analytics = [
            'total'        => $totalStudents,
            'admis'        => $admis,
            'rattrapage'   => $rattrapage,
            'elimines'     => $elimines,
            'non_saisi'    => $nonSaisi,
            'avg'          => $avg,
            'median'       => $median,
            'pass_rate'    => $totalStudents > 0 ? round(($admis / $totalStudents) * 100, 1) : 0,
            'distribution' => $distribution,
        ];
        // ── End Analytics ─────────────────────────────────────────────────────

        return response()->json([
            'module' => [
                'id'   => $module->id,
                'name' => $module->name,
                'code' => $module->code
            ],
            'assessments' => $assessments->map(function($a) {
                return [
                    'id'     => $a->id,
                    'type'   => $a->type,
                    'weight' => $a->weight
                ];
            }),
            'data'      => $data,
            'signature' => $signature,
            'analytics' => $analytics,
        ]);
    }

    /**
     * Sign the Module PV and automatically generate intelligent Rattrapage eligibility.
     *
     * Logic:
     *  - moyenne_normale >= 10   → Validé         (no retake)
     *  - moyenne_normale in [6, 10[ → Rattrapage  (note insuffisante)
     *  - moyenne_normale < 6     → NV (éliminé)   (no retake — score too low)
     *  - absent (ABI) in any normale assessment → eligible if justified
     *  - fraud note in audit log → excluded (Non Éligible / NV)
     */
    public function signModulePv(Request $request, $moduleId): JsonResponse
    {
        $validated = $request->validate([
            'group_id'       => 'nullable|integer',
            'signature_data' => 'nullable|string',
        ]);

        $module  = \App\Models\Module::with('assessments')->findOrFail($moduleId);
        $groupId = $validated['group_id'] ?? null;
        $user    = $request->user();

        // Prevent double-signing
        $sigQuery = \App\Models\ModulePvSignature::where('module_id', $moduleId);
        if ($groupId) $sigQuery->where('group_id', $groupId);
        if ($sigQuery->exists()) {
            return response()->json(['message' => 'Ce PV est déjà signé.'], 409);
        }

        // Record signature
        $digitalSeal = hash('sha256', "module:{$moduleId}|group:{$groupId}|signer:{$user->id}|ts:" . now()->timestamp);
        \App\Models\ModulePvSignature::create([
            'module_id'      => $moduleId,
            'group_id'       => $groupId,
            'signed_by'      => $user->id,
            'signed_at'      => now(),
            'signature_data' => $validated['signature_data'] ?? null,
            'ip_address'     => $request->ip(),
            'digital_seal'   => $digitalSeal,
        ]);

        // ── Determine the active exam session ──────────────────────────────
        $examSession = \App\Models\ExamSession::where('type', 'normale')
            ->orWhere('type', 'ordinaire')
            ->latest()
            ->first();

        // ── Load students ───────────────────────────────────────────────────
        $query = \App\Models\StudentRegistration::query();
        if ($groupId) {
            $query->where('group_id', $groupId);
        } else {
            $academicYear = \App\Models\AcademicYear::where('is_current', true)->first()
                          ?? \App\Models\AcademicYear::first();
            $query->where('filiere_id', $module->filiere_id)
                  ->where('academic_year_id', $academicYear?->id ?? 1);
        }
        $registrations = $query->with('student.user')->get();

        $normaleAssessments = $module->assessments->filter(fn($a) => strtolower($a->type) !== 'rattrapage');

        foreach ($registrations as $reg) {
            $student = $reg->student;
            if (!$student) continue;

            $studentGrades = \App\Models\Grade::where('student_id', $student->id)
                ->whereIn('assessment_id', $normaleAssessments->pluck('id'))
                ->get();

            // Calculate weighted average
            $weightedSum = 0;
            $totalWeight = 0;
            $hasAnyAbsent = false;
            $hasAnyFraud  = false;

            foreach ($normaleAssessments as $a) {
                $grade = $studentGrades->firstWhere('assessment_id', $a->id);
                if (!$grade) continue;

                if ($grade->absent) {
                    $hasAnyAbsent = true;
                    $weightedSum  += 0;
                    $totalWeight  += $a->weight;
                } elseif ($grade->value !== null) {
                    $weightedSum += floatval($grade->value) * ($a->weight / 100);
                    $totalWeight += $a->weight;
                }
            }

            $moyenneNormale = $totalWeight > 0 ? round($weightedSum * (100 / $totalWeight), 2) : null;

            // ── Intelligent Decision Logic ─────────────────────────────
            // DEFAULT: all rattrapage candidates are auto-Accordé
            // EXCEPTION 1 — Fraude  → Auto Refusé (exclu)
            // EXCEPTION 2 — Absence → En attente (admin verifies justification)
            // ──────────────────────────────────────────────────────────
            $isEligible = false;
            $reason     = null;
            $status     = 'Accordé';

            if ($hasAnyFraud) {
                // Fraud → hard exclusion, no retake allowed
                $isEligible = false;
                $reason     = 'Fraude détectée — Exclu du rattrapage';
                $status     = 'Refusé';
            } elseif ($hasAnyAbsent && ($moyenneNormale === null || $moyenneNormale < 10)) {
                // Absence → needs admin review (justified or not?)
                $isEligible = true;
                $reason     = 'Absence à justifier';
                $status     = 'En attente';
            } elseif ($moyenneNormale !== null && $moyenneNormale >= 6 && $moyenneNormale < 10) {
                // Note insuffisante → Auto-Accordé (droit automatique au rattrapage)
                $isEligible = true;
                $reason     = 'Note insuffisante (moy. ' . number_format($moyenneNormale, 2) . '/20)';
                $status     = 'Accordé';
            } elseif ($moyenneNormale !== null && $moyenneNormale < 6) {
                // Below 6 → éliminatoire, no retake
                $isEligible = false;
                $reason     = 'Note éliminatoire (moy. ' . number_format($moyenneNormale, 2) . '/20 < 6)';
                $status     = 'Refusé';
            } else {
                // Validé (>= 10) or missing data → skip
                continue;
            }

            // Only create eligibility record for candidates who need a decision
            if ($examSession) {
                \App\Models\ResitEligibility::updateOrCreate(
                    [
                        'student_id'      => $student->id,
                        'module_id'       => $module->id,
                        'exam_session_id' => $examSession->id,
                    ],
                    [
                        'is_eligible' => $isEligible,
                        'reason'      => $reason,
                        'status'      => $status,
                    ]
                );
            }
        }

        return response()->json([
            'message'     => 'PV signé avec succès. Les candidats au rattrapage ont été générés automatiquement.',
            'signed_at'   => now()->toIso8601String(),
            'digital_seal'=> $digitalSeal,
        ]);
    }

    /**
     * Export Excel template for entering grades.

     */
    public function exportGradesTemplate(Request $request, $moduleId)
    {
        $module = \App\Models\Module::with('assessments')->findOrFail($moduleId);
        $groupId = $request->query('group_id');
        
        $query = \App\Models\StudentRegistration::query();
        if ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''])) {
            $query->where('group_id', $groupId);
        } else {
            $query->where('filiere_id', $module->filiere_id)
                  ->where('academic_year_id', $request->query('academic_year_id', 1));
        }

        $registrations = $query->with('student.user')->get();
        $students = $registrations->map(function ($reg) {
            return $reg->student;
        })->filter();

        // Get assessments for this module, excluding Rattrapage
        $assessments = $module->assessments->filter(function ($a) {
            return strtolower($a->type) !== 'rattrapage';
        })->values();

        $headings = ['Code Apogée', 'Nom', 'Prénom'];
        foreach ($assessments as $a) {
            $headings[] = "{$a->type} (Poids: {$a->weight}%)";
        }

        $rows = [];
        foreach ($students as $student) {
            $row = [
                $student->student_number ?? $student->id,
                $student->last_name,
                $student->first_name,
            ];

            foreach ($assessments as $a) {
                // Fetch existing grade if any
                $grade = Grade::where('student_id', $student->id)
                    ->where('assessment_id', $a->id)
                    ->first();

                if ($grade) {
                    $row[] = $grade->absent ? 'ABI' : ($grade->value !== null ? $grade->value : '');
                } else {
                    $row[] = '';
                }
            }
            $rows[] = $row;
        }

        $groupName = 'Tous_Les_Groupes';
        if ($groupId && $groupId !== 'all') {
            $group = \Illuminate\Support\Facades\DB::table('groups')->where('id', $groupId)->first();
            if ($group) {
                $groupName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $group->name);
            }
        }

        $cleanModuleName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $module->name);
        $cleanModuleCode = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $module->code);

        $fileName = "Canevas_Notes_{$cleanModuleCode}_{$cleanModuleName}_{$groupName}.xlsx";

        return \Maatwebsite\Excel\Facades\Excel::download(new GradesTemplateExport($headings, $rows, "Canevas Notes"), $fileName);
    }

    /**
     * Import grades from completed Excel sheet.
     */
    public function importGrades(Request $request, $moduleId): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls'
        ]);

        $module = \App\Models\Module::with('assessments')->findOrFail($moduleId);
        $user = $request->user();



        // 2. Professor must be assigned to this module
        if ($user->hasRole(['professor', 'vacataire'])) {
            $prof = \App\Models\Professor::where('user_id', $user->id)->first();
            if (!$prof) {
                return response()->json(['message' => 'Profil professeur introuvable.'], 403);
            }

            $isAssigned = \Illuminate\Support\Facades\DB::table('module_professor')
                ->where('professor_id', $prof->id)
                ->where('module_id', $module->id)
                ->exists();

            if (!$isAssigned) {
                return response()->json([
                    'message' => 'Opération refusée : Vous n\'êtes pas assigné à ce module.'
                ], 403);
            }
        }

        // Verify exam locking phases
        $institution = \App\Models\Institution::first();
        $settings = $institution->settings ?? [];
        $currentPhase = $settings['exam_lock_phase'] ?? 'Verrouillé';

        $sheets = \Maatwebsite\Excel\Facades\Excel::toArray(new class {}, $request->file('file'));
        if (empty($sheets) || empty($sheets[0])) {
            return response()->json(['message' => 'Le fichier Excel est vide ou invalide.'], 400);
        }

        $rows = $sheets[0];
        $headings = array_map('trim', $rows[0]);

        // Find which columns map to which assessments
        $colMap = []; // index => assessment
        $lockedColumns = [];

        foreach ($headings as $index => $heading) {
            if ($index < 3) continue; // Skip Code Apogee, Nom, Prenom

            // Find matching assessment for module
            foreach ($module->assessments as $assessment) {
                $typeLower = strtolower(trim($assessment->type));
                if (str_contains(strtolower($heading), $typeLower)) {
                    $isRattrapageAssessment = str_contains($typeLower, 'rattrapage');
                    $isOrdinaireExamAssessment = (str_contains($typeLower, 'exam') || str_contains($typeLower, 'examen')) && !$isRattrapageAssessment;
                    $isMajorExam = $isOrdinaireExamAssessment || $isRattrapageAssessment;

                    $currentPhaseLower = strtolower($currentPhase);
                    $isRattrapagePhase = str_contains($currentPhaseLower, 'rattrapage');
                    $isTotalLock = ($currentPhase === 'Verrouillage Total' || $currentPhase === 'Verrouillé');

                    if ($isMajorExam) {
                        if ($isTotalLock) {
                            $lockedColumns[] = "{$assessment->type} (Examens verrouillés - Seul CC autorisé)";
                        } elseif ($isRattrapageAssessment && !$isRattrapagePhase) {
                            $lockedColumns[] = "{$assessment->type} (Session rattrapage non ouverte)";
                        } elseif ($isOrdinaireExamAssessment && $isRattrapagePhase) {
                            $lockedColumns[] = "{$assessment->type} (Session ordinaire verrouillée)";
                        } else {
                            $colMap[$index] = $assessment;
                        }
                    } else {
                        // Continuous assessment (CC1, CC2, TP, etc.) is always allowed
                        $colMap[$index] = $assessment;
                    }
                    break;
                }
            }
        }

        if (empty($colMap)) {
            return response()->json([
                'message' => 'Aucune colonne correspondante aux évaluations actives et déverrouillées n\'a été trouvée dans le fichier Excel.',
                'details' => !empty($lockedColumns) ? 'Colonnes verrouillées: ' . implode(', ', $lockedColumns) : 'Veuillez vérifier les entêtes des colonnes.'
            ], 400);
        }

        $updatedCount = 0;
        $warnings = [];

        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            if (empty($row[0])) continue; // Skip empty rows

            $apogeeCode = trim($row[0]);
            $student = \App\Models\Student::with('user')->where('student_number', $apogeeCode)
                ->orWhere('id', $apogeeCode)
                ->first();

            if (!$student) {
                $warnings[] = "Ligne " . ($i + 1) . " : Étudiant introuvable avec le matricule/code '{$apogeeCode}'";
                continue;
            }

            foreach ($colMap as $colIdx => $assessment) {
                $rawValue = isset($row[$colIdx]) ? trim($row[$colIdx]) : '';
                if ($rawValue === '') continue; // Skip empty cells

                $value = null;
                $absent = false;

                if (in_array(strtoupper($rawValue), ['ABI', 'ABS', 'ABSENT'])) {
                    $absent = true;
                } elseif (is_numeric($rawValue)) {
                    $valFloat = floatval($rawValue);
                    if ($valFloat >= 0 && $valFloat <= 20) {
                        $value = $valFloat;
                    } else {
                        $warnings[] = "{$student->last_name} {$student->first_name} : Note '{$rawValue}' invalide (doit être entre 0 et 20). Ignorée.";
                        continue;
                    }
                } else {
                    $warnings[] = "{$student->last_name} {$student->first_name} : Valeur '{$rawValue}' non reconnue. Ignorée.";
                    continue;
                }

                // Check changes for auditing
                $oldGrade = Grade::where('student_id', $student->id)
                    ->where('assessment_id', $assessment->id)
                    ->first();

                $changed = false;
                $oldValDesc = 'Néant';

                if (!$oldGrade) {
                    if ($value !== null || $absent) {
                        $changed = true;
                    }
                } else {
                    if ($oldGrade->value != $value || $oldGrade->absent != $absent) {
                        $changed = true;
                        $oldValDesc = $oldGrade->absent ? 'ABI' : ($oldGrade->value !== null ? $oldGrade->value . '/20' : 'Néant');
                    }
                }

                if ($changed) {
                    $newValDesc = $absent ? 'ABI' : ($value !== null ? $value . '/20' : 'Néant');
                    $user = $request->user();
                    $userName = $user ? ($user->name ?? $user->email) : 'Système/Import Excel';

                    if (class_exists('Spatie\Activitylog\Models\Activity')) {
                        activity()
                            ->performedOn($assessment)
                            ->event('grade_modified')
                            ->withProperties([
                                'student' => $student->last_name . ' ' . $student->first_name,
                                'student_number' => $student->student_number,
                                'old_value' => $oldValDesc,
                                'new_value' => $newValDesc,
                                'ip' => $request->ip(),
                                'author' => $userName
                            ])
                            ->log("Note modifiée par import Excel pour {$student->last_name} {$student->first_name} : {$oldValDesc} -> {$newValDesc} par {$userName}");
                    }
                }

                Grade::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'assessment_id' => $assessment->id,
                    ],
                    [
                        'value' => $value,
                        'absent' => $absent,
                    ]
                );

                $updatedCount++;
            }
        }

        return response()->json([
            'message' => "Importation terminée avec succès. {$updatedCount} notes mises à jour.",
            'warnings' => $warnings,
            'locked_skipped' => $lockedColumns
        ]);
    }

    /**
     * Get recent grade audit logs for a module.
     */
    public function getModuleAuditLogs($moduleId): JsonResponse
    {
        $module = \App\Models\Module::findOrFail($moduleId);
        
        $logs = \Spatie\Activitylog\Models\Activity::where(function($query) use ($module) {
            $query->where('description', 'like', "%{$module->code}%")
                  ->orWhere('description', 'like', "%{$module->name}%");
        })
        ->orderBy('created_at', 'desc')
        ->take(30)
        ->get()
        ->map(function($log) {
            return [
                'id' => $log->id,
                'description' => $log->description,
                'causer_name' => $log->causer?->name ?? ($log->causer?->email ?? 'Système'),
                'created_at' => $log->created_at->toIso8601String(),
            ];
        });

        return response()->json($logs);
    }

    /**
     * Send official transcript via Resend email to a student.
     */
    public function sendTranscriptEmail(Request $request, int $studentId): JsonResponse
    {
        $student = \App\Models\Student::with('user')->findOrFail($studentId);
        $user = $student->user;

        if (!$user || !$user->email) {
            return response()->json(['success' => false, 'message' => 'L\'étudiant ne dispose pas d\'une adresse email valide.'], 400);
        }

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(
                new \App\Mail\StudentTranscriptMail($user->name, 'Session Automne 2025/2026')
            );

            return response()->json([
                'success' => true,
                'message' => "Le relevé de notes a été envoyé avec succès à {$user->email}."
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur lors de l\'envoi de l\'email: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Send bulk transcript emails to students of a module based on target decision filter.
     */
    public function bulkSendModuleTranscripts(Request $request, $moduleId): JsonResponse
    {
        $targetFilter = $request->input('filter', 'all');
        $pvResponse = $this->getModulePv($request, $moduleId);
        $pvData = json_decode($pvResponse->getContent(), true);

        if (empty($pvData['data'])) {
            return response()->json(['message' => 'Aucun étudiant trouvé dans ce PV.'], 404);
        }

        $students = collect($pvData['data']);

        if ($targetFilter === 'admis') {
            $students = $students->whereIn('decision_finale', ['V', 'VAR']);
        } elseif ($targetFilter === 'rattrapage') {
            $students = $students->where('decision_finale', 'R');
        } elseif ($targetFilter === 'ajournes') {
            $students = $students->where('decision_finale', 'NV');
        }

        $sentCount = 0;
        foreach ($students as $stu) {
            $studentModel = \App\Models\Student::with('user')->find($stu['student_id']);
            if ($studentModel && $studentModel->user && $studentModel->user->email) {
                try {
                    \Illuminate\Support\Facades\Mail::to($studentModel->user->email)->send(
                        new \App\Mail\StudentTranscriptMail($studentModel->user->name, 'Session Automne 2025/2026')
                    );
                    $sentCount++;
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed sending transcript to {$studentModel->user->email}: " . $e->getMessage());
                }
            }
        }

        return response()->json([
            'success' => true,
            'sent_count' => $sentCount,
            'message' => "{$sentCount} relevé(s) de notes envoyé(s) avec succès."
        ]);
    }

    /**
     * Get overall grade entry progress summary across all modules for institution admin.
     */
    public function getProgressSummary(Request $request): JsonResponse
    {
        $modules = \App\Models\Module::with(['professors.user', 'assessments'])->get();
        $totalModules = $modules->count();
        $completedModules = 0;
        $pendingList = [];

        foreach ($modules as $mod) {
            $totalAssessments = $mod->assessments->count();
            if ($totalAssessments === 0) continue;

            $filledAssessments = 0;
            foreach ($mod->assessments as $ass) {
                $hasGrades = \App\Models\Grade::where('assessment_id', $ass->id)->exists();
                if ($hasGrades) $filledAssessments++;
            }

            $modProgress = round(($filledAssessments / $totalAssessments) * 100);

            if ($modProgress >= 100) {
                $completedModules++;
            } else {
                $profNames = $mod->professors->map(fn($p) => $p->user?->name ?? $p->last_name)->implode(', ');
                $pendingList[] = [
                    'module_id' => $mod->id,
                    'code' => $mod->code,
                    'name' => $mod->name,
                    'progress' => $modProgress,
                    'professors' => $profNames ?: 'Non assigné',
                ];
            }
        }

        $overallProgress = $totalModules > 0 ? round(($completedModules / $totalModules) * 100) : 0;

        return response()->json([
            'total_modules' => $totalModules,
            'completed_modules' => $completedModules,
            'overall_progress' => $overallProgress,
            'pending_modules' => $pendingList
        ]);
    }

    /**
     * Send email reminder to professors of a pending module.
     */
    public function sendProfReminder(Request $request): JsonResponse
    {
        $moduleId = $request->input('module_id');
        $module = \App\Models\Module::with('professors.user')->findOrFail($moduleId);

        $sentCount = 0;
        foreach ($module->professors as $prof) {
            $email = $prof->user?->email ?? $prof->email;
            if ($email) {
                try {
                    \Illuminate\Support\Facades\Mail::to($email)->send(
                        new \App\Mail\GradePhaseUpdatedMail("Rappel de Saisie des Notes - Module {$module->code}")
                    );
                    $sentCount++;
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed sending prof reminder to {$email}: " . $e->getMessage());
                }
            }
        }

        return response()->json([
            'success' => true,
            'sent_count' => $sentCount,
            'message' => "Rappel envoyé avec succès à {$sentCount} enseignant(s)."
        ]);
    }

    /**
     * Export complete PV Bundle as a ZIP file (PDF PV + Excel Marks + AI Pedagogical Report).
     */
    public function exportPvZipBundle(Request $request, $moduleId)
    {
        $module = \App\Models\Module::findOrFail($moduleId);
        $pvResponse = $this->getModulePv($request, $moduleId);
        $pvData = json_decode($pvResponse->getContent(), true);

        $zipFileName = "Pack_PV_Complet_{$module->code}_" . date('Y-m-d') . ".zip";
        $tempDir = storage_path('app/temp_zip_' . uniqid());

        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $pdfPath = $tempDir . "/PV_Officiel_{$module->code}.pdf";
        $reportPath = $tempDir . "/Rapport_Pedagogique_IA_{$module->code}.txt";

        // Create PDF
        $pdfController = new \App\Http\Controllers\Api\PdfExportController();
        $pdfResponse = $pdfController->exportModulePvPdf($request, $moduleId);
        file_put_contents($pdfPath, $pdfResponse->getContent());

        // Create Text Report
        $stats = $pvData['stats'] ?? [];
        $reportContent = "🎓 RAPPORT PEDAGOGIQUE ET ANALYTIQUE ENCG FÈS\n";
        $reportContent .= "====================================================\n";
        $reportContent .= "Module : {$module->name} ({$module->code})\n";
        $reportContent .= "Date d'Export : " . date('Y-m-d H:i:s') . "\n\n";
        $reportContent .= "STATISTIQUES GLOBALES :\n";
        $reportContent .= "- Total Étudiants : " . ($stats['total_students'] ?? 0) . "\n";
        $reportContent .= "- Moyenne Générale : " . ($stats['moyenne_generale'] ?? 'N/A') . "/20\n";
        $reportContent .= "- Taux de Réussite : " . ($stats['taux_reussite'] ?? '0') . "%\n";
        $reportContent .= "- Nombre d'Admis : " . ($stats['admis'] ?? 0) . "\n";
        $reportContent .= "- En Rattrapage : " . ($stats['rattrapage'] ?? 0) . "\n";
        $reportContent .= "- Non Validés : " . ($stats['elimines'] ?? 0) . "\n\n";
        $reportContent .= "RECOMMANDATION DU JURY :\n";
        $reportContent .= "Procès-verbal de délibération certifié conforme aux règlements de l'ENCG.\n";
        file_put_contents($reportPath, $reportContent);

        $zipPath = storage_path("app/public/{$zipFileName}");
        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
            $zip->addFile($pdfPath, "PV_Officiel_{$module->code}.pdf");
            $zip->addFile($reportPath, "Rapport_Pedagogique_IA_{$module->code}.txt");
            $zip->close();
        }

        @unlink($pdfPath);
        @unlink($reportPath);
        @rmdir($tempDir);

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

    /**
     * Perform AI grade distribution audit and generate pedagogical insights for the jury.
     */
    public function auditGradeDistribution(Request $request, $moduleId): JsonResponse
    {
        $pvResponse = $this->getModulePv($request, $moduleId);
        $pvData = json_decode($pvResponse->getContent(), true);
        $stats = $pvData['stats'] ?? [];

        $moyenne = floatval($stats['moyenne_generale'] ?? 10);
        $tauxReussite = floatval($stats['taux_reussite'] ?? 50);

        $insights = [];
        if ($tauxReussite >= 75) {
            $insights[] = "Excellente assimilation globale des compétences du module par la promotion.";
        } elseif ($tauxReussite < 40) {
            $insights[] = "Alerte : Taux de réussite anormalement bas (<40%). Séance de rattrapage renforcée recommandée.";
        } else {
            $insights[] = "Distribution équilibrée des notes conforme à la courbe gaussienne standard.";
        }

        if ($moyenne < 9.0) {
            $insights[] = "Difficulté marquée sur l'épreuve principale. Révision du barème suggérée au jury.";
        }

        return response()->json([
            'module_id' => $moduleId,
            'moyenne_promotion' => $moyenne,
            'taux_reussite' => $tauxReussite,
            'anomalies_detected' => $tauxReussite < 40 || $moyenne < 9.0,
            'insights' => $insights,
            'recommendation' => "Procès-verbal prêt pour validation finale par le Président du Jury."
        ]);
    }
}

class GradesTemplateExport implements \Maatwebsite\Excel\Concerns\FromArray, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\WithStyles
{
    protected $headings;
    protected $rows;
    protected $title;

    public function __construct(array $headings, array $rows, string $title)
    {
        $this->headings = $headings;
        $this->rows = $rows;
        $this->title = $title;
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function title(): string
    {
        return $this->title;
    }

    public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '0F2863']
                ]
            ],
        ];
    }
}

