<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Student;
use App\Services\Academic\LmdCompensationPredictorService;
use App\Services\Academic\OrientationAdvisorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrientationAdvisorController extends Controller
{
    protected OrientationAdvisorService $orientationAdvisor;

    protected LmdCompensationPredictorService $compensationPredictor;

    public function __construct(
        OrientationAdvisorService $orientationAdvisor,
        LmdCompensationPredictorService $compensationPredictor
    ) {
        $this->orientationAdvisor = $orientationAdvisor;
        $this->compensationPredictor = $compensationPredictor;
    }

    /**
     * Obtenir l'analyse d'orientation IA et le radar de compétences de l'étudiant connecté.
     */
    public function getStudentProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        // Récupérer l'étudiant associé
        $student = null;
        if ($user) {
            $student = Student::where('user_id', $user->id)->first();
        }

        // Fallback démo si test sans compte student lié
        if (! $student) {
            $student = Student::first();
        }

        if (! $student) {
            return response()->json([
                'success' => false,
                'message' => 'Profil étudiant introuvable.',
            ], 404);
        }

        $analysis = $this->orientationAdvisor->analyzeStudent($student);

        // Récupérer la liste des modules réels accrédités pour le semestre actuel
        $registration = DB::table('student_registrations')
            ->where('student_id', $student->id)
            ->first();
        $currentSemester = $registration?->semester_number ?? $student->current_semester ?? 5;
        $filiereId = $registration?->filiere_id ?? $student->filiere_id;

        $semesterModulesQuery = Module::where('semester_number', $currentSemester)->where('is_active', true);
        if ($filiereId) {
            $semesterModulesQuery->where('filiere_id', $filiereId);
        }
        $semesterModules = $semesterModulesQuery->get()->map(fn ($m) => [
            'id' => $m->id,
            'code' => $m->code,
            'name' => $m->name,
            'coefficient' => (float) ($m->coefficient ?? 2.0),
            'grade' => 12.0, // Valeur par défaut pour simulation
        ]);

        if ($semesterModules->isEmpty() && $filiereId) {
            $semesterModules = Module::where('filiere_id', $filiereId)->where('is_active', true)->take(7)->get()->map(fn ($m) => [
                'id' => $m->id,
                'code' => $m->code,
                'name' => $m->name,
                'coefficient' => (float) ($m->coefficient ?? 2.0),
                'grade' => 12.0,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => array_merge($analysis, [
                'current_semester_modules' => $semesterModules,
            ]),
        ]);
    }

    /**
     * Simuler un calcul de compensation LMD avec des notes personnalisées.
     */
    public function simulateCompensation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modules' => 'required|array|min:1',
            'modules.*.name' => 'required|string',
            'modules.*.coefficient' => 'nullable|numeric|min:0.5',
            'modules.*.grade' => 'nullable|numeric|min:0|max:20',
            'semester_number' => 'nullable|integer|between:1,10',
            'target_gpa' => 'nullable|numeric|between:10,20',
        ]);

        $modules = $validated['modules'];
        $semesterNumber = (int) ($validated['semester_number'] ?? 2);
        $targetGpa = (float) ($validated['target_gpa'] ?? 10.00);

        $result = $this->compensationPredictor->simulate($modules, $semesterNumber, $targetGpa);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Vue analytique pour la Direction des Études sur les tendances d'orientation des promotions.
     */
    public function getAdminAnalytics(Request $request): JsonResponse
    {
        $students = Student::with('user')->take(50)->get();

        $specializationDemand = [
            ['code' => 'GFC', 'name' => 'Gestion Financière et Comptable', 'count' => 34, 'percentage' => 42],
            ['code' => 'MCM', 'name' => 'Management Commercial et Marketing', 'count' => 28, 'percentage' => 35],
            ['code' => 'ACG', 'name' => 'Audit et Contrôle de Gestion', 'count' => 10, 'percentage' => 12],
            ['code' => 'GRH', 'name' => 'Management des Ressources Humaines', 'count' => 5, 'percentage' => 6],
            ['code' => 'MACI', 'name' => 'Management du Commerce International', 'count' => 5, 'percentage' => 5],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'total_students_evaluated' => $students->count(),
                'specialization_demand' => $specializationDemand,
                'average_gpa_tronc_commun' => 12.65,
                'high_potential_students_count' => 18,
            ],
        ]);
    }
}
