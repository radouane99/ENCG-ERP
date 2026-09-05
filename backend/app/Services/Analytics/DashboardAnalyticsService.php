<?php

namespace App\Services\Analytics;

use App\Models\Application;
use App\Models\AttendanceRecord;
use App\Models\Filiere;
use App\Models\FinalProject;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Student;
use App\Models\User;
use App\Models\VacationContract;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardAnalyticsService
{
    /**
     * Get statistics for the comprehensive Executive / Pilotage Dashboard
     */
    public function getGlobalMetrics(): array
    {
        try {
            // 1. Démographie Étudiante (Répartition par genre)
            $studentsGender = Student::select('gender', DB::raw('count(*) as total'))
                ->groupBy('gender')
                ->get();

            // 2. Répartition par Filière
            $studentsByFiliere = DB::table('students')
                ->join('student_pathways', function ($join) {
                    $join->on('students.id', '=', 'student_pathways.student_id')
                        ->where('student_pathways.is_current', '=', true);
                })
                ->join('filieres', 'student_pathways.filiere_id', '=', 'filieres.id')
                ->select('filieres.code as name', DB::raw('count(students.id) as value'))
                ->whereNull('students.deleted_at')
                ->groupBy('filieres.id', 'filieres.code')
                ->get();

            // 3. Admissions (Taux d'acceptation et statuts)
            $admissionStats = Application::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get();

            // 4. Projets PFE/PFA
            $projectsStats = FinalProject::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get();

            // 5. Ressources Humaines (Permanent vs Vacataire)
            $hrStats = [
                'permanents' => Professor::where('contract_type', 'permanent')->count(),
                'vacataires' => VacationContract::where('status', 'active')->count(),
            ];

            // 6. Finances (computed when available)
            $finances = [
                'budget_alloue' => DB::table('budgets')->value('allocated') ?? null,
                'budget_consomme' => DB::table('vacation_payments')->where('status', 'paid')->sum('total_amount') ?? 0,
                'en_attente' => DB::table('vacation_payments')->where('status', 'pending')->sum('total_amount') ?? 0,
            ];

            // Global KPIs
            $kpis = [
                'total_students' => Student::count(),
                'total_professors' => Professor::count(),
                'success_rate' => null,
                'dropout_rate' => null,
                'budget_used_percent' => ($finances['budget_alloue'] && $finances['budget_alloue'] > 0)
                    ? ($finances['budget_consomme'] / $finances['budget_alloue']) * 100
                    : null,
            ];

            return [
                'success' => true,
                'data' => [
                    'kpis' => $kpis,
                    'charts' => [
                        'students_by_filiere' => $studentsByFiliere,
                        'students_gender' => $studentsGender,
                        'admissions' => $admissionStats,
                        'projects' => $projectsStats,
                        'hr' => $hrStats,
                        'finances' => $finances,
                    ],
                ],
            ];
        } catch (\Throwable $e) {
            \Log::error('Analytics getGlobalMetrics failed: '.$e->getMessage());
            throw new \Exception('Analytics data unavailable');
        }
    }

    /**
     * Get statistics specifically tailored for the Admin operational dashboard
     */
    public function getAdminStats(): array
    {
        $totalStudents = Student::count();
        $activeStudents = Student::where('status', 'active')->count();
        $newThisMonth = Student::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)->count();

        $totalProfessors = Professor::count();
        $activeProfessors = Professor::where('is_active', true)->count();
        $permanentProfessors = Professor::where('contract_type', 'permanent')->count();

        $totalVacataires = VacationContract::count();
        $pendingVacataires = VacationContract::where('status', 'pending')->count();
        $totalVacHours = VacationContract::sum('agreed_hours');

        $totalRecords = AttendanceRecord::count();
        $presentRecords = AttendanceRecord::where('status', 'present')->count();
        $attendanceRate = $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : 0;

        return [
            'success' => true,
            'data' => [
                'students' => [
                    'total' => $totalStudents,
                    'active' => $activeStudents,
                    'new_this_month' => $newThisMonth,
                    'graduated' => Student::where('status', 'graduated')->count(),
                    'suspended' => Student::where('status', 'suspended')->count(),
                ],
                'professors' => [
                    'total' => $totalProfessors,
                    'active' => $activeProfessors,
                    'permanent' => $permanentProfessors,
                    'contractual' => Professor::where('contract_type', 'contractual')->count(),
                ],
                'vacataires' => [
                    'total' => $totalVacataires,
                    'pending' => $pendingVacataires,
                    'total_hours' => $totalVacHours,
                ],
                'academic' => [
                    'total_modules' => Module::count(),
                    'total_filieres' => Filiere::where('is_active', true)->count(),
                ],
                'attendance_rate' => $attendanceRate,
            ],
        ];
    }

    /**
     * Get statistics specifically tailored for the Student Dashboard
     */
    public function getStudentStats(int $userId): array
    {
        try {
            $student = Student::where('user_id', $userId)->first()
                ?? Student::where('id', $userId)->first();

            if (! $student) {
                return [
                    'success' => true,
                    'data' => [
                        'gpa' => null,
                        'attendance' => 100,
                        'absences' => ['total' => 0, 'justified' => 0, 'unjustified' => 0],
                        'upcoming_exams' => 0,
                        'pending_assignments' => 0,
                        'upcoming_classes' => [],
                        'recent_documents' => [],
                    ],
                ];
            }

            $totalRecords = AttendanceRecord::where('student_id', $student->id)->count();
            $presentRecords = AttendanceRecord::where('student_id', $student->id)->where('status', 'present')->count();
            $absentRecords = max(0, $totalRecords - $presentRecords);
            $attendanceRate = $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : 100;

            $grades = DB::table('grades')->where('student_id', $student->id)->whereNotNull('value')->avg('value');

            $upcomingExams = 0;
            if (Schema::hasTable('exams')) {
                $upcomingExams = DB::table('exams')->where('date', '>=', now())->count();
            }

            return [
                'success' => true,
                'data' => [
                    'gpa' => $grades !== null ? round($grades, 2) : null,
                    'attendance' => $attendanceRate,
                    'absences' => [
                        'total' => $absentRecords,
                        'justified' => 0,
                        'unjustified' => $absentRecords,
                    ],
                    'upcoming_exams' => $upcomingExams,
                    'pending_assignments' => 0,
                    'upcoming_classes' => [],
                    'recent_documents' => [],
                ],
            ];
        } catch (\Throwable $e) {
            \Log::error('Analytics getStudentStats failed for user '.$userId.': '.$e->getMessage());

            return [
                'success' => true,
                'data' => [
                    'gpa' => null,
                    'attendance' => 100,
                    'absences' => ['total' => 0, 'justified' => 0, 'unjustified' => 0],
                    'upcoming_exams' => 0,
                    'pending_assignments' => 0,
                    'upcoming_classes' => [],
                    'recent_documents' => [],
                ],
            ];
        }
    }

    /**
     * Get statistics specifically tailored for the Professor Dashboard
     */
    public function getProfessorStats(int $userId): array
    {
        try {
            $user = User::find($userId);

            // 1. Professeur lié au user (Query Builder — évite un bug de double-include du modèle Eloquent sur volume Docker Windows)
            $professorRow = DB::table('professors')->where('user_id', $userId)->whereNull('deleted_at')->first();
            if (! $professorRow && $user?->email) {
                $professorRow = DB::table('professors')
                    ->join('users', 'users.id', '=', 'professors.user_id')
                    ->where('users.email', $user->email)
                    ->whereNull('professors.deleted_at')
                    ->select('professors.*')
                    ->first();
            }

            if (! $professorRow) {
                return [
                    'success' => true,
                    'data' => [
                        'total_students' => 0,
                        'total_modules' => 0,
                        'total_groups' => 0,
                        'pending_grades' => 0,
                        'statutory_hours_done' => 0,
                        'statutory_hours_total' => 240,
                        'pfe_supervised_count' => 0,
                        'next_classes' => [],
                        'modules_list' => [],
                        'pfe_list' => [],
                        'surveillances' => [],
                        'has_contract' => false,
                        'professor_id' => $userId,
                        'department_name' => 'ENCG Fès',
                        'rank' => 'Professeur',
                    ],
                ];
            }

            $profId = (int) $professorRow->id;
            $departmentName = 'Management, Finance & Comptabilité';
            if (! empty($professorRow->department_id)) {
                $departmentName = DB::table('departments')->where('id', $professorRow->department_id)->value('name')
                    ?: $departmentName;
            }
            $rankName = (string) ($user?->rank ?? $professorRow->grade ?? 'Professeur de l’Enseignement Supérieur (PES)');
            $isVisiting = ($professorRow->contract_type ?? '') === 'visiting';

            // 2. Affectations = table pivot module_professor uniquement (pas modules.professor_id)
            $assignedFromPivot = DB::table('module_professor')
                ->where('professor_id', $profId)
                ->get();

            $allModuleIds = $assignedFromPivot->pluck('module_id')->filter()->unique()->values()->all();
            $totalModules = count($allModuleIds);

            // 3. Groupes assignés
            $assignedGroupIds = $assignedFromPivot->pluck('group_id')->filter()->unique()->values()->all();
            $totalGroups = count($assignedGroupIds);

            // 4. Total étudiants (inscriptions + pathways courants)
            $studentCount = 0;
            if (! empty($assignedGroupIds)) {
                $fromRegistrations = (int) DB::table('student_registrations')
                    ->whereIn('group_id', $assignedGroupIds)
                    ->distinct()
                    ->count('student_id');

                $fromPathways = 0;
                if (Schema::hasTable('student_pathways')) {
                    $fromPathways = (int) DB::table('student_pathways')
                        ->whereIn('group_id', $assignedGroupIds)
                        ->where('is_current', true)
                        ->distinct()
                        ->count('student_id');
                }

                $studentCount = max($fromRegistrations, $fromPathways);
            }

            // 5. Notes Apogée en attente (uniquement modules affectés)
            $pendingGrades = 0;
            if (! empty($allModuleIds)) {
                $assessmentIds = DB::table('assessments')->whereIn('module_id', $allModuleIds)->pluck('id');
                if ($assessmentIds->isNotEmpty()) {
                    $pendingGrades = (int) DB::table('grades')
                        ->whereIn('assessment_id', $assessmentIds)
                        ->whereNull('value')
                        ->count();
                    if ($pendingGrades === 0) {
                        $pendingGrades = (int) DB::table('assessments')
                            ->whereIn('id', $assessmentIds)
                            ->where('status', 'draft')
                            ->count();
                    }
                }
            }

            // 6. Charge statutaire : heures affectées vs service annuel
            $statutoryTotal = 240;
            if ($isVisiting) {
                $contractHours = (int) DB::table('vacation_contracts')->where('professor_id', $profId)->sum('total_hours');
                $statutoryTotal = $contractHours > 0 ? $contractHours : 120;
            }

            $assignedHoursTotal = (int) $assignedFromPivot->sum('assigned_hours');

            $completedSessionsCount = 0;
            if (Schema::hasColumn('attendance_sessions', 'professor_id')) {
                $completedSessionsCount = (int) DB::table('attendance_sessions')
                    ->where('professor_id', $profId)
                    ->where('status', 'completed')
                    ->count();
            }
            $statutoryDone = $completedSessionsCount > 0
                ? $completedSessionsCount * 2
                : $assignedHoursTotal;

            // 7. Modules List avec Progression & Détails
            $modules = collect();
            if (! empty($allModuleIds)) {
                $modules = DB::table('modules')
                ->whereIn('modules.id', $allModuleIds)
                ->leftJoin('filieres', 'modules.filiere_id', '=', 'filieres.id')
                ->select(
                    'modules.id',
                    'modules.name',
                    'modules.code',
                    'modules.credit_hours',
                    'modules.filiere_id',
                    'filieres.name as filiere_name',
                    'filieres.code as filiere_code'
                )
                ->get()
                ->map(function ($mod) use ($assignedFromPivot) {
                    $assignmentRows = $assignedFromPivot->where('module_id', $mod->id);
                    $assignmentRow = $assignmentRows->first();
                    $groupName = 'Section A';
                    if ($assignmentRow && ! empty($assignmentRow->group_id)) {
                        $groupName = DB::table('groups')->where('id', $assignmentRow->group_id)->value('name') ?? 'Groupe Affecté';
                    } else {
                        $groupName = $mod->filiere_code ?? ($mod->filiere_name ?? 'Tronc Commun');
                    }

                    $totalAssessments = DB::table('assessments')->where('module_id', $mod->id)->count();
                    $enteredGrades = 0;
                    if ($totalAssessments > 0) {
                        $assIds = DB::table('assessments')->where('module_id', $mod->id)->pluck('id');
                        $enteredGrades = DB::table('grades')->whereIn('assessment_id', $assIds)->whereNotNull('value')->count();
                    }
                    $expected = max(1, $totalAssessments * 30);
                    $progress = $totalAssessments > 0
                        ? (int) round(min(100, ($enteredGrades / $expected) * 100))
                        : 0;

                    $creditHours = (int) ($assignmentRows->sum('assigned_hours')
                        ?: ($mod->credit_hours > 0 ? $mod->credit_hours : 36));
                    $hoursDone = (int) round(($progress / 100) * $creditHours);

                    return [
                        'id' => $mod->id,
                        'name' => $mod->name,
                        'code' => $mod->code ?? "MOD-{$mod->id}",
                        'filiere' => $mod->filiere_name ?? 'ENCG Fès',
                        'group_name' => $groupName,
                        'progress' => $progress,
                        'hours_done' => $hoursDone,
                        'hours_total' => $creditHours,
                    ];
                });
            }
            // 8. Emploi du Temps / Séances (Query Builder — pas de morph Professor)
            $daysMap = [1 => 'Lundi', 2 => 'Mardi', 3 => 'Mercredi', 4 => 'Jeudi', 5 => 'Vendredi', 6 => 'Samedi'];
            $nextClasses = [];

            if (Schema::hasTable('schedules')) {
                $scheduleRows = DB::table('schedules')
                    ->leftJoin('modules', 'schedules.module_id', '=', 'modules.id')
                    ->leftJoin('rooms', 'schedules.room_id', '=', 'rooms.id')
                    ->leftJoin('groups', 'schedules.group_id', '=', 'groups.id')
                    ->where(function ($q) {
                        $q->where('schedules.is_active', true)->orWhereNull('schedules.is_active');
                    })
                    ->where(function ($q) use ($profId, $userId) {
                        $q->where('schedules.professor_id', $profId)
                            ->orWhere('schedules.professor_id', $userId);
                    })
                    ->orderBy('schedules.day_of_week')
                    ->orderBy('schedules.start_time')
                    ->select(
                        'schedules.id',
                        'schedules.day_of_week',
                        'schedules.start_time',
                        'schedules.end_time',
                        'schedules.session_type',
                        'modules.name as module_name',
                        'modules.code as module_code',
                        'rooms.name as room_name',
                        'groups.name as group_name'
                    )
                    ->limit(12)
                    ->get();

                $nextClasses = $scheduleRows->map(function ($sched) use ($daysMap) {
                    $dayName = $daysMap[$sched->day_of_week] ?? 'Jour';
                    $startTime = date('H:i', strtotime($sched->start_time));
                    $endTime = date('H:i', strtotime($sched->end_time));
                    $type = strtoupper($sched->session_type ?? 'CM');

                    return [
                        'session_id' => $sched->id,
                        'title' => $sched->module_name ?? 'Séance Pédagogique',
                        'code' => $sched->module_code ?? $type,
                        'time' => "{$startTime} - {$endTime}",
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'day_of_week' => (int) $sched->day_of_week,
                        'day_name' => $dayName,
                        'full_time' => "{$dayName} {$startTime} - {$endTime}",
                        'location' => $sched->room_name ?? 'Salle ENCG',
                        'room' => $sched->room_name ?? 'Salle ENCG',
                        'group' => $sched->group_name ?? 'Groupe 1',
                        'session_type' => $type,
                    ];
                })->values()->toArray();
            }

            if ((empty($nextClasses)) && $modules->isNotEmpty()) {
                $nextClasses = [];
            }

            // 9. Encadrements PFE & Stages Réels
            $pfeList = [];
            try {
            if (Schema::hasTable('internships')) {
                $titleCol = Schema::hasColumn('internships', 'topic')
                    ? 'internships.topic'
                    : (Schema::hasColumn('internships', 'title') ? 'internships.title' : 'internships.type');

                $pfeList = DB::table('internships')
                    ->where('supervisor_id', $profId)
                    ->leftJoin('students', 'internships.student_id', '=', 'students.id')
                    ->leftJoin('users', 'students.user_id', '=', 'users.id')
                    ->select(
                        'internships.id',
                        DB::raw("{$titleCol} as title"),
                        'internships.company_name as company',
                        'internships.status',
                        'users.name as student_name',
                        'users.first_name',
                        'users.last_name'
                    )
                    ->take(5)
                    ->get()
                    ->map(function ($p) {
                        $name = $p->student_name ?: trim(($p->first_name ?? '').' '.($p->last_name ?? ''));

                        return [
                            'id' => $p->id,
                            'student_name' => $name ?: 'Étudiant PFE',
                            'title' => $p->title ?: 'Stage / PFE',
                            'company' => $p->company ?: '—',
                            'status' => $p->status ?: 'pending',
                        ];
                    });
            }
            } catch (\Throwable $e) {
                \Log::warning('Professor PFE stats skipped: '.$e->getMessage());
                $pfeList = [];
            }

            // 10. Surveillances d'Examens Réelles
            $surveillances = [];
            try {
            if (Schema::hasTable('exam_surveillances')) {
                $hasEndTime = Schema::hasColumn('exams', 'end_time');
                $hasDuration = Schema::hasColumn('exams', 'duration_minutes');
                $surveillances = DB::table('exam_surveillances')
                    ->where('exam_surveillances.professor_id', $profId)
                    ->leftJoin('exams', 'exam_surveillances.exam_id', '=', 'exams.id')
                    ->leftJoin('modules', 'exams.module_id', '=', 'modules.id')
                    ->leftJoin('rooms', 'exam_surveillances.room_id', '=', 'rooms.id')
                    ->leftJoin('exam_sessions', 'exams.exam_session_id', '=', 'exam_sessions.id')
                    ->select(array_values(array_filter([
                        'exam_surveillances.id',
                        'exam_surveillances.role',
                        'exam_surveillances.confirmed_at',
                        'exam_surveillances.sent_at',
                        'exams.exam_date',
                        'exams.start_time',
                        $hasEndTime ? 'exams.end_time' : null,
                        $hasDuration ? 'exams.duration_minutes' : null,
                        'modules.name as module_name',
                        'rooms.name as room_name',
                        'exam_sessions.name as session_name',
                    ])))
                    ->orderBy('exams.exam_date')
                    ->take(5)
                    ->get()
                    ->map(function ($s) {
                        $startTime = $s->start_time ? substr((string) $s->start_time, 0, 5) : '14:30';
                        if (! empty($s->end_time)) {
                            $endTime = substr((string) $s->end_time, 0, 5);
                        } elseif (! empty($s->duration_minutes) && $s->start_time) {
                            $endTime = date('H:i', strtotime($s->start_time) + ((int) $s->duration_minutes * 60));
                        } else {
                            $endTime = '16:30';
                        }
                        $dateFormatted = $s->exam_date ? date('d/m/Y', strtotime($s->exam_date)) : '—';

                        return [
                            'id' => $s->id,
                            'module_name' => $s->module_name ?? 'Épreuve',
                            'date' => $dateFormatted,
                            'time' => "{$startTime} - {$endTime}",
                            'room' => $s->room_name ?? '—',
                            'role' => $s->role ?? 'Surveillant',
                            'session_name' => $s->session_name ?? 'Session',
                            'is_confirmed' => ! empty($s->confirmed_at),
                            'confirmed_at' => $s->confirmed_at,
                        ];
                    });
            }
            } catch (\Throwable $e) {
                \Log::warning('Professor surveillances stats skipped: '.$e->getMessage());
                $surveillances = [];
            }

            return [
                'success' => true,
                'data' => [
                    'total_students' => $studentCount,
                    'total_modules' => $totalModules,
                    'total_groups' => $totalGroups,
                    'pending_grades' => $pendingGrades,
                    'statutory_hours_done' => $statutoryDone,
                    'statutory_hours_total' => $statutoryTotal,
                    'pfe_supervised_count' => count($pfeList),
                    'next_classes' => $nextClasses,
                    'modules_list' => $modules instanceof \Illuminate\Support\Collection ? $modules->values()->all() : $modules,
                    'pfe_list' => $pfeList instanceof \Illuminate\Support\Collection ? $pfeList->values()->all() : $pfeList,
                    'surveillances' => $surveillances instanceof \Illuminate\Support\Collection ? $surveillances->values()->all() : $surveillances,
                    'has_contract' => $isVisiting,
                    'professor_id' => $profId ?? $userId,
                    'department_name' => $departmentName,
                    'rank' => $rankName,
                ],
            ];
        } catch (\Throwable $e) {
            \Log::error('Analytics getProfessorStats failed for user '.$userId.': '.$e->getMessage());

            return [
                'success' => true,
                'error_debug' => $e->getMessage(),
                'data' => [
                    'total_students' => 0,
                    'total_modules' => 0,
                    'total_groups' => 0,
                    'pending_grades' => 0,
                    'statutory_hours_done' => 0,
                    'statutory_hours_total' => 240,
                    'pfe_supervised_count' => 0,
                    'next_classes' => [],
                    'modules_list' => [],
                    'pfe_list' => [],
                    'surveillances' => [],
                    'has_contract' => false,
                    'professor_id' => $userId,
                    'department_name' => 'ENCG Fès',
                    'rank' => 'Professeur',
                ],
            ];
        }
    }
}
