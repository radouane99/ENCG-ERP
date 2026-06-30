<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Models\Student;
use App\Models\Filiere;
use App\Models\Professor;
use App\Models\VacationContract;
use App\Models\FinalProject;
use App\Models\Application;
use Illuminate\Support\Facades\DB;

class PilotageController extends Controller
{
    public function getGlobalMetrics(): JsonResponse
    {
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
            'permanents' => Professor::count(),
            'vacataires' => VacationContract::where('status', 'active')->count()
        ];

        // 6. Finances (Budget Vacataires estimé vs payé) - Mock values based on records
        $finances = [
            'budget_alloue' => 500000, // Budget fictif global
            'budget_consomme' => DB::table('vacation_payments')->where('status', 'paid')->sum('total_amount') ?? 125000,
            'en_attente' => DB::table('vacation_payments')->where('status', 'pending')->sum('total_amount') ?? 45000,
        ];

        // Global KPIs
        $kpis = [
            'total_students' => Student::count(),
            'total_professors' => Professor::count(),
            'success_rate' => 85.4, // Mock success rate %
            'dropout_rate' => 2.1,  // Mock dropout rate %
            'budget_used_percent' => ($finances['budget_consomme'] / max($finances['budget_alloue'], 1)) * 100
        ];

        return response()->json([
            'kpis' => $kpis,
            'charts' => [
                'students_by_filiere' => $studentsByFiliere,
                'students_gender' => $studentsGender,
                'admissions' => $admissionStats,
                'projects' => $projectsStats,
                'hr' => $hrStats,
                'finances' => $finances
            ]
        ]);
    }
}
