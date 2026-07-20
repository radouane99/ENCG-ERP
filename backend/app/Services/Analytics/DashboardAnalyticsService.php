<?php

namespace App\Services\Analytics;

use Illuminate\Support\Facades\DB;
use App\Models\Student;
use App\Models\Professor;
use App\Models\Module;
use App\Models\Filiere;
use App\Models\VacationContract;
use App\Models\AttendanceRecord;
use App\Models\Application;
use App\Models\FinalProject;

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
                ->join('filieres', 'students.filiere_id', '=', 'filieres.id')
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
                'vacataires' => VacationContract::where('status', 'active')->count()
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
                        'finances' => $finances
                    ]
                ]
            ];
        } catch (\Throwable $e) {
            \Log::error('Analytics getGlobalMetrics failed: ' . $e->getMessage());
            throw new \Exception('Analytics data unavailable');
        }
    }

    /**
     * Get statistics specifically tailored for the Admin operational dashboard
     */
    public function getAdminStats(): array
    {
        $totalStudents  = Student::count();
        $activeStudents = Student::where('status', 'active')->count();
        $newThisMonth   = Student::whereMonth('created_at', now()->month)
                                 ->whereYear('created_at', now()->year)->count();

        $totalProfessors     = Professor::count();
        $activeProfessors    = Professor::where('is_active', true)->count();
        $permanentProfessors = Professor::where('contract_type', 'permanent')->count();

        $totalVacataires   = VacationContract::count();
        $pendingVacataires = VacationContract::where('status', 'pending')->count();
        $totalVacHours     = VacationContract::sum('agreed_hours');

        $totalRecords   = AttendanceRecord::count();
        $presentRecords = AttendanceRecord::where('status', 'present')->count();
        $attendanceRate = $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : 0;

        return [
            'success' => true,
            'data' => [
                'students' => [
                    'total'          => $totalStudents,
                    'active'         => $activeStudents,
                    'new_this_month' => $newThisMonth,
                    'graduated'      => Student::where('status', 'graduated')->count(),
                    'suspended'      => Student::where('status', 'suspended')->count(),
                ],
                'professors' => [
                    'total'          => $totalProfessors,
                    'active'         => $activeProfessors,
                    'permanent'      => $permanentProfessors,
                    'contractual'    => Professor::where('contract_type', 'contractual')->count(),
                ],
                'vacataires' => [
                    'total'         => $totalVacataires,
                    'pending'       => $pendingVacataires,
                    'total_hours'   => $totalVacHours,
                ],
                'academic' => [
                    'total_modules'  => Module::count(),
                    'total_filieres' => Filiere::where('is_active', true)->count(),
                ],
                'attendance_rate'   => $attendanceRate,
            ]
        ];
    }

    /**
     * Get statistics specifically tailored for the Student Dashboard
     */
    public function getStudentStats(int $userId): array
    {
        $student = Student::where('user_id', $userId)->first();
        
        if (!$student) {
            return [
                'success' => false,
                'message' => 'Étudiant introuvable pour cet utilisateur.'
            ];
        }

        // Attendance calculation
        try {
            $totalRecords = AttendanceRecord::where('student_id', $student->id)->count();
            $presentRecords = AttendanceRecord::where('student_id', $student->id)->where('status', 'present')->count();
            $absentRecords = $totalRecords - $presentRecords;
            $attendanceRate = $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : null;

            $grades = DB::table('grades')->where('student_id', $student->id)->avg('value');

            return [
                'success' => true,
                'data' => [
                    'gpa'                 => $grades !== null ? round($grades, 2) : null,
                    'attendance'          => $attendanceRate,
                    'absences'            => [
                        'total' => $absentRecords,
                        'justified' => 0,
                        'unjustified' => $absentRecords
                    ],
                    'upcoming_exams'      => DB::table('exams')->where('date', '>=', now())->count(),
                    'pending_assignments' => null,
                    'upcoming_classes'    => [],
                    'recent_documents'    => []
                ]
            ];
        } catch (\Throwable $e) {
            \Log::error('Analytics getStudentStats failed for user ' . $userId . ': ' . $e->getMessage());
            throw new \Exception('Analytics data unavailable for student');
        }
    }

    /**
     * Get statistics specifically tailored for the Professor Dashboard
     */
    public function getProfessorStats(int $userId): array
    {
        $professor = Professor::where('user_id', $userId)->first();
        
        if (!$professor) {
            return [
                'success' => false,
                'message' => 'Professeur introuvable pour cet utilisateur.'
            ];
        }

        $modulesCount = DB::table('module_professor')
            ->where('professor_id', $professor->id)
            ->count();
            
        $academicYearId = \App\Models\AcademicYear::where('is_current', true)->value('id') ?? 1;

        $filiereIds = DB::table('module_professor')
            ->where('professor_id', $professor->id)
            ->join('modules', 'module_professor.module_id', '=', 'modules.id')
            ->pluck('modules.filiere_id');

        $studentCount = DB::table('student_registrations')
            ->where('academic_year_id', $academicYearId)
            ->whereIn('filiere_id', $filiereIds)
            ->distinct('student_id')
            ->count('student_id');
            
        // Get actual modules with their names
        $modules = DB::table('module_professor')
            ->where('professor_id', $professor->id)
            ->join('modules', 'module_professor.module_id', '=', 'modules.id')
            ->select('modules.id', 'modules.name', 'modules.code', 'modules.credit_hours')
            ->get()->map(function($mod) {
                $totalAssessments = DB::table('assessments')->where('module_id', $mod->id)->count();
                $enteredGrades = DB::table('grades')->whereIn('assessment_id', function($q) use ($mod) {
                    $q->select('id')->from('assessments')->where('module_id', $mod->id);
                })->count();
                $expected = max(1, $totalAssessments * 30);
                $progress = (int) round(min(100, ($enteredGrades / $expected) * 100));
                return [
                    'id' => $mod->id,
                    'name' => $mod->name,
                    'code' => $mod->code,
                    'progress' => $progress,
                    'hours_done' => (int) round(($progress / 100) * ($mod->credit_hours ?? 45)),
                    'hours_total' => $mod->credit_hours ?? 45
                ];
            });

        try {
            $next_classes = [];

            return [
                'success' => true,
                'data' => [
                    'total_students' => $studentCount,
                    'total_modules'  => $modulesCount,
                    'pending_grades' => DB::table('grades')->where('professor_id', $professor->id)->whereNull('approved_at')->count(),
                    'next_classes'   => $next_classes,
                    'modules_list'   => $modules,
                    'has_contract'   => $professor->contract_type === 'visiting',
                    'professor_id'   => $professor->id
                ]
            ];
        } catch (\Throwable $e) {
            \Log::error('Analytics getProfessorStats failed for user ' . $userId . ': ' . $e->getMessage());
            throw new \Exception('Analytics data unavailable for professor');
        }
    }
}
