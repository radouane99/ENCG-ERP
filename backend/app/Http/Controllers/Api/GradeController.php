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

        $studentsQuery = Student::whereHas('registrations', function ($q) use ($assessment, $academicYearId) {
            $q->where('filiere_id', $assessment->module->filiere_id)
              ->where('academic_year_id', $academicYearId);
        });

        // Eager load grades for this specific assessment
        $students = $studentsQuery->with(['grades' => function ($q) use ($assessmentId) {
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

    /**
     * Bulk save grades for an assessment.
     */
    public function storeBulk(Request $request, $assessmentId): JsonResponse
    {
        $assessment = Assessment::findOrFail($assessmentId);

        $validated = $request->validate([
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.value' => 'nullable|numeric|min:0|max:20',
            'grades.*.absent' => 'boolean',
        ]);

        foreach ($validated['grades'] as $gradeData) {
            Grade::updateOrCreate(
                [
                    'student_id' => $gradeData['student_id'],
                    'assessment_id' => $assessment->id,
                ],
                [
                    'value' => !empty($gradeData['absent']) ? null : ($gradeData['value'] ?? null),
                    'absent' => $gradeData['absent'] ?? false,
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
        if (!$groupId) {
            return response()->json(['message' => 'Le paramètre group_id est requis.'], 400);
        }

        $module = \App\Models\Module::with('assessments')->findOrFail($moduleId);
        
        // Get all students registered in this group
        $registrations = \App\Models\StudentRegistration::where('group_id', $groupId)
            ->with('student')
            ->get();

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

        return response()->json([
            'module' => [
                'id' => $module->id,
                'name' => $module->name,
                'code' => $module->code
            ],
            'assessments' => $assessments->map(function($a) {
                return [
                    'id' => $a->id,
                    'type' => $a->type,
                    'weight' => $a->weight
                ];
            }),
            'data' => $data
        ]);
    }
}
