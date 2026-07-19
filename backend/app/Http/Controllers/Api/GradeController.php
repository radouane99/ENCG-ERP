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
        
        // We find all students registered to the module's filiere for the current active academic year
        // We'll assume academic_year_id = 1 for this implementation, or extract from request if provided
        $academicYearId = $request->query('academic_year_id', 1);

        $groupId = $request->query('group_id');
        $studentsQuery = Student::whereHas('registrations', function ($q) use ($assessment, $academicYearId, $groupId) {
            $q->where('filiere_id', $assessment->module->filiere_id)
              ->where('academic_year_id', $academicYearId);
            if ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''])) {
                $q->where('group_id', $groupId);
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
                'apogee' => $student->cne_cme ?? $student->student_number, // Fallback
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

        // [AUDIT SEC-04] Verify exam locking phases
        $institution = \App\Models\Institution::first();
        $settings = $institution->settings ?? [];
        $currentPhase = $settings['exam_lock_phase'] ?? 'Verrouillé';

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
                
                $gradesDetail[$a->type] = [
                    'value' => $val,
                    'is_absent' => $isAbsent,
                    'weight' => $a->weight
                ];

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
        if ($groupId && $groupId !== 'all') {
            $sigRecord = \App\Models\ModulePvSignature::where('module_id', $moduleId)
                ->where('group_id', $groupId)
                ->with('signer')
                ->first();
            if ($sigRecord) {
                $signature = [
                    'signed_by' => $sigRecord->signer->name ?? $sigRecord->signer->email,
                    'signed_at' => $sigRecord->signed_at->toIso8601String(),
                    'signature_data' => $sigRecord->signature_data,
                    'ip_address' => $sigRecord->ip_address,
                    'digital_seal' => $sigRecord->digital_seal,
                ];
            }
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

        $groupName = 'Module';
        if ($groupId && $groupId !== 'all') {
            $group = \Illuminate\Support\Facades\DB::table('groups')->where('id', $groupId)->first();
            if ($group) {
                $groupName = $group->name;
            }
        }

        $fileName = "Canevas_Notes_{$module->code}_{$groupName}.xlsx";

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
     * Digitally sign a module PV for a specific group.
     */
    public function signModulePv(Request $request, $moduleId): JsonResponse
    {
        $validated = $request->validate([
            'group_id' => 'required|exists:groups,id',
            'signature_data' => 'required|string', // Base64 data URI
        ]);

        $module = \App\Models\Module::findOrFail($moduleId);
        $groupId = $validated['group_id'];
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non autorisé.'], 401);
        }

        // Query grades details to build a SHA-256 digital seal hash
        $registrations = \App\Models\StudentRegistration::where('group_id', $groupId)
            ->where('filiere_id', $module->filiere_id)
            ->with(['student.grades' => function($q) use ($module) {
                $q->whereIn('assessment_id', $module->assessments->pluck('id'));
            }])
            ->get();
        
        $sealData = [];
        foreach ($registrations as $reg) {
            if ($reg->student) {
                $sealData[$reg->student_id] = $reg->student->grades->pluck('value', 'assessment_id')->toArray();
            }
        }
        
        $digitalSeal = hash('sha256', json_encode([
            'module_id' => $module->id,
            'group_id' => $groupId,
            'grades' => $sealData
        ]));

        // Save or update signature
        $signature = \App\Models\ModulePvSignature::updateOrCreate(
            [
                'module_id' => $module->id,
                'group_id' => $groupId,
                'academic_year_id' => $request->query('academic_year_id', 1),
            ],
            [
                'signed_by' => $user->id,
                'signature_data' => $validated['signature_data'],
                'ip_address' => $request->ip(),
                'signed_at' => now(),
                'digital_seal' => $digitalSeal,
            ]
        );

        // Audit Log signature
        if (class_exists('Spatie\Activitylog\Models\Activity')) {
            activity()
                ->performedOn($signature)
                ->event('pv_signed')
                ->log("Le PV de délibération pour le module {$module->code} (Groupe ID {$groupId}) a été signé électroniquement par {$user->name}. Empreinte : " . substr($digitalSeal, 0, 10));
        }

        return response()->json([
            'message' => 'Le PV a été signé et verrouillé avec succès.',
            'signature' => [
                'signed_by' => $user->name ?? $user->email,
                'signed_at' => $signature->signed_at->toIso8601String(),
                'signature_data' => $signature->signature_data,
                'ip_address' => $signature->ip_address,
                'digital_seal' => $signature->digital_seal,
            ]
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
                'causer_name' => $log->causer->name ?? ($log->causer->email ?? 'Système'),
                'created_at' => $log->created_at->toIso8601String(),
            ];
        });

        return response()->json($logs);
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
