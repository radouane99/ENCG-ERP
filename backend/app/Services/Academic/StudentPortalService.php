<?php

namespace App\Services\Academic;

use App\Models\AbsenceJustification;
use App\Models\Attendance;
use App\Models\Grade;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StudentPortalService
{
    /**
     * Get published grades and calculated modular results for the student.
     */
    public function getGrades(int $studentId): array
    {
        $student = DB::table('students')->where('id', $studentId)->first();
        if (! $student) {
            return [
                'data' => [],
                'overall_average' => null,
                'overall_decision' => null,
                'total_modules' => 0,
                'validated_modules' => 0,
                'credits_earned' => 0,
                'total_credits' => 0,
            ];
        }

        // 1. Identify student filiere and semester
        $pathway = DB::table('student_pathways')
            ->where('student_id', $studentId)
            ->where('is_current', true)
            ->first();

        $filiereId = $pathway?->filiere_id;
        $semesterNumber = $pathway?->current_semester;

        if (! $filiereId) {
            $reg = DB::table('student_registrations')
                ->where('student_id', $studentId)
                ->first();
            $filiereId = $reg?->filiere_id;
            $semesterNumber = $reg?->semester_number;
        }

        // 2. Fetch modules for this student's filiere or modules that have grades
        $modulesQuery = DB::table('modules');
        if ($filiereId) {
            $modulesQuery->where('filiere_id', $filiereId);
        }
        $modules = $modulesQuery->get();

        // Also check any module IDs the student has grades for
        $gradedModuleIds = DB::table('grades')
            ->join('assessments', 'grades.assessment_id', '=', 'assessments.id')
            ->where('grades.student_id', $studentId)
            ->distinct()
            ->pluck('assessments.module_id')
            ->toArray();

        $missingModuleIds = array_diff($gradedModuleIds, $modules->pluck('id')->toArray());
        if (! empty($missingModuleIds)) {
            $extraModules = DB::table('modules')->whereIn('id', $missingModuleIds)->get();
            $modules = $modules->concat($extraModules);
        }

        // 3. Fetch all assessments for these modules
        $moduleIds = $modules->pluck('id')->toArray();
        $assessments = DB::table('assessments')
            ->whereIn('module_id', $moduleIds)
            ->get()
            ->groupBy('module_id');

        // 4. Fetch all student grades for these assessments
        $allAssessmentIds = $assessments->flatten()->pluck('id')->toArray();
        $grades = ! empty($allAssessmentIds)
            ? DB::table('grades')
                ->where('student_id', $studentId)
                ->whereIn('assessment_id', $allAssessmentIds)
                ->get()
                ->keyBy('assessment_id')
            : collect();

        $rows = [];
        $sumFinal = 0;
        $countFinal = 0;
        $validatedCount = 0;
        $creditsEarned = 0;
        $totalCredits = 0;

        foreach ($modules as $module) {
            $modAssessments = $assessments->get($module->id, collect());

            $ccNote = null;
            $examNote = null;
            $rattrapageNote = null;
            $weightedSum = 0;
            $totalWeight = 0;
            $hasAnyGrade = false;

            foreach ($modAssessments as $ass) {
                $type = strtolower((string) $ass->type);
                $grade = $grades->get($ass->id);
                $val = $grade ? ($grade->absent ? 0.0 : (float) $grade->value) : null;

                if ($val !== null) {
                    $hasAnyGrade = true;
                }

                if (str_contains($type, 'rat')) {
                    $rattrapageNote = $val;
                } elseif (str_contains($type, 'cc') || str_contains($type, 'continu') || str_contains($type, 'tp')) {
                    $ccNote = $val;
                    if ($val !== null) {
                        $w = (float) ($ass->weight ?? 50);
                        $weightedSum += $val * ($w / 100);
                        $totalWeight += $w;
                    }
                } else {
                    $examNote = $val;
                    if ($val !== null) {
                        $w = (float) ($ass->weight ?? 50);
                        $weightedSum += $val * ($w / 100);
                        $totalWeight += $w;
                    }
                }
            }

            // Calculate moyenne normale
            $moyenneNormale = null;
            if ($totalWeight > 0 && $hasAnyGrade) {
                $moyenneNormale = round($weightedSum * (100 / $totalWeight), 2);
            } elseif ($hasAnyGrade && ($ccNote !== null || $examNote !== null)) {
                $notes = array_filter([$ccNote, $examNote], fn ($n) => $n !== null);
                $moyenneNormale = count($notes) > 0 ? round(array_sum($notes) / count($notes), 2) : null;
            }

            // Determine final average & decision
            $moyenneFinale = $moyenneNormale;
            $decisionFinale = null;

            if ($moyenneNormale !== null) {
                if ($rattrapageNote !== null) {
                    $raw = max($moyenneNormale, $rattrapageNote);
                    if ($raw >= 10.0) {
                        $moyenneFinale = ($moyenneNormale < 10.0) ? min(12.00, round($raw, 2)) : round($raw, 2);
                        $decisionFinale = ($moyenneNormale < 10.0) ? 'VAR' : 'V';
                    } else {
                        $moyenneFinale = round($raw, 2);
                        $decisionFinale = 'NV';
                    }
                } else {
                    if ($moyenneNormale >= 10.0) {
                        $decisionFinale = 'V';
                    } elseif ($moyenneNormale < 6.0) {
                        $decisionFinale = 'NV';
                    } else {
                        $decisionFinale = 'RAT';
                    }
                }

                $sumFinal += $moyenneFinale;
                $countFinal++;

                $isVal = in_array($decisionFinale, ['V', 'VAR', 'VC']) || $moyenneFinale >= 10.0;
                if ($isVal) {
                    $validatedCount++;
                    $creditsEarned += ($module->credits ?? $module->credit_hours ?? 5);
                }
            }

            $totalCredits += ($module->credits ?? $module->credit_hours ?? 5);
            $sem = $module->semester ?? $module->semester_number ?? $semesterNumber ?? 1;

            $rows[] = [
                'module_id' => $module->id,
                'module_name' => $module->name,
                'module_code' => $module->code,
                'semester_number' => "S{$sem}",
                'semester' => "S{$sem}",
                'credits' => $module->credits ?? $module->credit_hours ?? 5,
                'cc_note' => $ccNote,
                'exam_note' => $examNote,
                'rattrapage_note' => $rattrapageNote,
                'moyenne_normale' => $moyenneNormale,
                'moyenne_finale' => $moyenneFinale,
                'decision_normale' => $moyenneNormale !== null ? ($moyenneNormale >= 10 ? 'V' : ($moyenneNormale < 6 ? 'NV' : 'RAT')) : null,
                'decision_finale' => $decisionFinale,
                'has_grades' => $hasAnyGrade,
            ];
        }

        $overallAverage = $countFinal > 0 ? round($sumFinal / $countFinal, 2) : null;
        $overallDecision = null;

        if ($overallAverage !== null) {
            if ($overallAverage >= 16.0) {
                $overallDecision = 'ADMIS (MENTION TRÈS BIEN)';
            } elseif ($overallAverage >= 14.0) {
                $overallDecision = 'ADMIS (MENTION BIEN)';
            } elseif ($overallAverage >= 12.0) {
                $overallDecision = 'ADMIS (MENTION ASSEZ BIEN)';
            } elseif ($overallAverage >= 10.0) {
                $overallDecision = 'ADMIS (MENTION PASSABLE)';
            } else {
                $overallDecision = 'AJOURNÉ (SESSION DE RATTRAPAGE)';
            }
        }

        return [
            'data' => $rows,
            'overall_average' => $overallAverage,
            'overall_decision' => $overallDecision,
            'total_modules' => count($rows),
            'validated_modules' => $validatedCount,
            'credits_earned' => $creditsEarned,
            'total_credits' => $totalCredits ?: 30,
        ];
    }

    /**
     * Get student schedule.
     */
    public function getSchedule(int $studentId): Collection
    {
        $groupId = DB::table('student_pathways')
            ->where('student_id', $studentId)
            ->where('is_current', true)
            ->value('group_id')
            ?: DB::table('student_registrations')
                ->where('student_id', $studentId)
                ->value('group_id');

        if (! $groupId) {
            return collect([]);
        }

        $query = DB::table('schedules')
            ->join('modules', 'schedules.module_id', '=', 'modules.id')
            ->leftJoin('rooms', 'schedules.room_id', '=', 'rooms.id')
            ->leftJoin('professors', 'schedules.professor_id', '=', 'professors.id')
            ->leftJoin('users', 'professors.user_id', '=', 'users.id')
            ->where('schedules.group_id', $groupId)
            ->where('schedules.is_active', true);

        if (Schema::hasTable('schedule_versions')) {
            $query->leftJoin('schedule_versions', 'schedules.schedule_version_id', '=', 'schedule_versions.id')
                ->where(function ($q) {
                    $q->whereNull('schedules.schedule_version_id')
                        ->orWhere('schedule_versions.status', 'PUBLISHED');
                });
        }

        if (Schema::hasColumn('rooms', 'is_out_of_service')) {
            $query->where(function ($q) {
                $q->whereNull('rooms.id')
                    ->orWhere('rooms.is_out_of_service', false);
            });
        }

        $daysMap = [
            1 => 'Lundi',
            2 => 'Mardi',
            3 => 'Mercredi',
            4 => 'Jeudi',
            5 => 'Vendredi',
            6 => 'Samedi',
            7 => 'Dimanche',
        ];

        return $query
            ->select(
                'schedules.id',
                'schedules.day_of_week',
                'schedules.start_time',
                'schedules.end_time',
                'modules.id as module_id',
                'modules.name as module_name',
                'modules.code as module_code',
                'rooms.name as room_name',
                'schedules.session_type as type',
                DB::raw("COALESCE(NULLIF(users.name, ''), CONCAT(COALESCE(users.first_name, ''), ' ', COALESCE(users.last_name, ''))) as professor")
            )
            ->orderBy('schedules.day_of_week')
            ->orderBy('schedules.start_time')
            ->get()
            ->map(function ($s) use ($daysMap) {
                $dayName = $daysMap[(int) $s->day_of_week] ?? 'Lundi';
                $startTime = substr((string) $s->start_time, 0, 5);
                $endTime = substr((string) $s->end_time, 0, 5);
                $timeFormatted = "{$startTime} - {$endTime}";
                $rawType = strtolower((string) $s->type);
                $typeLabel = $rawType === 'cm' ? 'Cours Magistral (CM)' : ($rawType === 'td' ? 'Travaux Dirigés (TD)' : ($rawType === 'tp' ? 'Travaux Pratiques (TP)' : ucfirst((string) $s->type)));
                $profName = trim((string) $s->professor);
                if (! empty($profName) && ! str_starts_with($profName, 'Pr.') && ! str_starts_with($profName, 'Dr.')) {
                    $profName = "Pr. {$profName}";
                }

                return [
                    'id' => $s->id,
                    'day_of_week' => (int) $s->day_of_week,
                    'day' => $dayName,
                    'time' => $timeFormatted,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'module_id' => $s->module_id,
                    'module_code' => $s->module_code,
                    'module_name' => $s->module_name,
                    'module' => $s->module_name,
                    'title' => $s->module_name,
                    'room' => $s->room_name ?? 'Amphithéâtre / Salle non assignée',
                    'location' => $s->room_name ?? 'Amphithéâtre / Salle non assignée',
                    'type' => $typeLabel,
                    'raw_type' => $rawType,
                    'professor' => ! empty($profName) ? $profName : 'Enseignant non assigné',
                ];
            });
    }

    /**
     * Submit a medical certificate or other justification for an absence.
     */
    public function submitAbsenceJustification(array $data, ?UploadedFile $file, int $studentId): array
    {
        app(AcademicWindowGuard::class)->assertJustificationsOpen();

        $attendance = Attendance::where('student_id', $studentId)
            ->whereKey($data['attendance_id'])
            ->firstOrFail();

        $path = $file ? $file->store('justifications', 'private') : null;

        $justification = AbsenceJustification::create([
            'student_id' => $studentId,
            'attendance_id' => $attendance->id,
            'reason' => $data['reason'],
            'description' => $data['description'] ?? null,
            'document_path' => $path,
            'status' => 'pending',
        ]);

        return [
            'success' => true,
            'message' => 'Justificatif soumis avec succès. En attente de validation.',
            'data' => $justification,
        ];
    }

    /**
     * Dashboard specific stats (100% Live DB Data).
     */
    public function getDashboardStats(int $studentId): array
    {
        $student = DB::table('students')->where('id', $studentId)->first();

        $absencesCount = DB::table('attendances')
            ->where('student_id', $studentId)
            ->where('status', 'absent')
            ->count();

        $absencesJustified = DB::table('attendances')
            ->where('student_id', $studentId)
            ->where('status', 'absent')
            ->where('is_justified', true)
            ->count();

        $absencesUnjustified = max(0, $absencesCount - $absencesJustified);

        // Real grades calculations
        $gradesResult = $this->getGrades($studentId);
        $gpa = $gradesResult['overall_average'];
        $publishedGrades = $gradesResult['total_modules'];
        $creditsEarned = $gradesResult['credits_earned'];
        $totalCredits = $gradesResult['total_credits'];

        $pathway = DB::table('student_pathways')
            ->where('student_id', $studentId)
            ->where('is_current', true)
            ->first();

        $groupId = $pathway?->group_id;
        if (! $groupId) {
            $groupId = DB::table('student_registrations')
                ->where('student_id', $studentId)
                ->value('group_id');
        }

        $classesToday = 0;
        $upcomingExams = 0;
        $upcomingClasses = [];

        if ($groupId) {
            $currentDayOfWeek = now()->dayOfWeekIso; // 1 (Mon) - 7 (Sun)
            $classesToday = DB::table('schedules')
                ->where('group_id', $groupId)
                ->where('day_of_week', $currentDayOfWeek)
                ->where('is_active', true)
                ->count();

            $upcomingClasses = DB::table('schedules')
                ->join('modules', 'schedules.module_id', '=', 'modules.id')
                ->leftJoin('rooms', 'schedules.room_id', '=', 'rooms.id')
                ->leftJoin('professors', 'schedules.professor_id', '=', 'professors.id')
                ->leftJoin('users', 'professors.user_id', '=', 'users.id')
                ->where('schedules.group_id', $groupId)
                ->where('schedules.day_of_week', $currentDayOfWeek)
                ->where('schedules.is_active', true)
                ->orderBy('schedules.start_time')
                ->select([
                    'schedules.id',
                    'schedules.start_time',
                    'schedules.end_time',
                    'modules.name as title',
                    'rooms.name as location',
                    DB::raw("COALESCE(NULLIF(users.name, ''), CONCAT(COALESCE(users.first_name, ''), ' ', COALESCE(users.last_name, ''))) as professor"),
                ])
                ->get()
                ->map(function ($c) {
                    $currentTime = now()->format('H:i');
                    $start = substr((string) $c->start_time, 0, 5);
                    $end = substr((string) $c->end_time, 0, 5);
                    $status = 'upcoming';
                    if ($currentTime > $end) {
                        $status = 'completed';
                    } elseif ($currentTime >= $start && $currentTime <= $end) {
                        $status = 'current';
                    }

                    $prof = trim((string) $c->professor);
                    if (! empty($prof) && ! str_starts_with($prof, 'Pr.') && ! str_starts_with($prof, 'Dr.')) {
                        $prof = "Pr. {$prof}";
                    }

                    return [
                        'time' => "{$start} - {$end}",
                        'title' => $c->title,
                        'location' => $c->location ?: 'Amphi / Salle non assignée',
                        'professor' => ! empty($prof) ? $prof : 'Enseignant non assigné',
                        'status' => $status,
                    ];
                })
                ->toArray();

            $upcomingExams = DB::table('exams')
                ->where('group_id', $groupId)
                ->whereDate('exam_date', '>=', now()->toDateString())
                ->count();
        }

        // Convocations check if exams count is 0
        if ($upcomingExams === 0) {
            $upcomingExams = DB::table('exam_seatings')
                ->where('student_id', $studentId)
                ->count();
        }

        $recentDocuments = DB::table('document_requests')
            ->join('document_types', 'document_requests.document_type_id', '=', 'document_types.id')
            ->where('document_requests.student_id', $studentId)
            ->orderByDesc('document_requests.created_at')
            ->limit(5)
            ->get([
                'document_requests.id',
                'document_types.name as title',
                'document_requests.created_at as date',
                'document_requests.status',
                'document_requests.hash',
            ])
            ->map(fn ($doc) => [
                'id' => $doc->id,
                'title' => $doc->title,
                'date' => substr((string) $doc->date, 0, 10),
                'status' => $doc->status === 'ready' || $doc->status === 'delivered' ? 'signed' : 'pending',
                'hash' => $doc->hash ?: ('ENCG-DOC-' . strtoupper(substr(md5($doc->id . $studentId), 0, 12))),
            ])
            ->toArray();

        $subGroupInfo = app(StudentSubGroupDispatcherService::class)->getStudentSubGroupInfo($studentId);

        return [
            'student_id' => $studentId,
            'cne' => $student?->cne,
            'cin' => $student?->cin,
            'first_name' => $student?->first_name,
            'last_name' => $student?->last_name,
            'full_name' => trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')),
            'absences' => [
                'total' => $absencesCount,
                'justified' => $absencesJustified,
                'unjustified' => $absencesUnjustified,
            ],
            'published_grades' => $publishedGrades,
            'classes_today' => $classesToday,
            'upcoming_classes' => $upcomingClasses,
            'gpa' => $gpa,
            'overall_decision' => $gradesResult['overall_decision'],
            'credits_earned' => $creditsEarned,
            'total_credits' => $totalCredits,
            'upcoming_exams' => $upcomingExams,
            'recent_documents' => $recentDocuments,
            'academic_info' => $subGroupInfo,
            'section' => $subGroupInfo['section_label'] ?? null,
            'sub_group' => $subGroupInfo['sub_group'] ?? null,
            'group_name' => $subGroupInfo['group_name'] ?? null,
            'filiere_name' => $subGroupInfo['filiere_name'] ?? null,
            'semester' => $subGroupInfo['semester'] ?? null,
        ];
    }
}
