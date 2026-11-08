<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Module;
use App\Models\SpecialtyWish;
use App\Models\Student;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\GradeService;
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
        $student = Student::where('user_id', $request->user()->id)->where('institution_id', $request->user()->institution_id)->first();
        abort_unless($student, 404, 'Profil étudiant non lié à ce compte. Contactez la scolarité.');
        $yearId = AcademicContext::yearId();
        $registration = DB::table('student_registrations')->where('student_id', $student->id)->where('academic_year_id', $yearId)->orderByDesc('id')->first();
        $semester = $registration?->semester_number;
        $modules = $registration ? Module::where('institution_id', $student->institution_id)->where('filiere_id', $registration->filiere_id)->where('semester_number', $semester)->where('is_active', true)->get()->map(function ($module) use ($student) {
            $hasGrades = Grade::where('student_id', $student->id)->whereHas('assessment', fn ($q) => $q->where('module_id', $module->id))->exists();
            $assessments = $module->assessments()->get()->reject(fn ($a) => in_array(strtolower($a->type), ['rattrapage', 'resit', 'r']));
            $complete = $assessments->isNotEmpty() && Grade::where('student_id', $student->id)->whereIn('assessment_id', $assessments->pluck('id'))->where(fn ($q) => $q->whereNotNull('value')->orWhere('absent', true))->count() === $assessments->count();
            $average = $complete ? app(GradeService::class)->calculateWeightedAverage($student, $assessments) : null;

            return ['id' => $module->id, 'code' => $module->code, 'name' => $module->name, 'coefficient' => $module->coefficient, 'grade' => $average, 'grade_source' => $complete ? 'recorded' : 'missing'];
        }) : collect();

        return response()->json(['success' => true, 'data' => array_merge($this->orientationAdvisor->analyzeStudent($student), [
            'current_semester_modules' => $modules, 'current_semester' => $semester, 'academic_year_id' => $yearId,
            'has_registration' => (bool) $registration,
        ])]);
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
        $year = AcademicYear::where('institution_id', $request->user()->institution_id)->findOrFail(AcademicContext::yearId());
        $wishes = SpecialtyWish::where('academic_year', $year->displayLabel())->where('preference_rank', 1)->whereHas('student', fn ($q) => $q->where('institution_id', $request->user()->institution_id));
        $counts = (clone $wishes)->selectRaw('filiere_id, count(*) as total')->groupBy('filiere_id')->get();
        $total = $counts->sum('total');
        $filieres = Filiere::whereIn('id', $counts->pluck('filiere_id'))->where('institution_id', $request->user()->institution_id)->get()->keyBy('id');

        return response()->json(['success' => true, 'data' => ['academic_year' => $year->displayLabel(), 'total_students_evaluated' => $total, 'specialization_demand' => $counts->filter(fn ($r) => isset($filieres[$r->filiere_id]))->map(fn ($r) => ['code' => $filieres[$r->filiere_id]->code, 'name' => $filieres[$r->filiere_id]->name, 'count' => (int) $r->total, 'percentage' => $total ? round(100 * $r->total / $total, 1) : 0])->values(), 'average_gpa_tronc_commun' => null, 'high_potential_students_count' => null, 'source' => 'recorded_first_preferences']]);
    }

    /**
     * Simulateur Live de Rang & Quota d'Orientation (Tronc Commun S4 ➔ Spécialités S5).
     */
    public function getLiveQuotaRanking(Request $request): JsonResponse
    {
        $student = Student::where('user_id', $request->user()->id)
            ->where('institution_id', $request->user()->institution_id)
            ->first();
        abort_unless($student, 404, 'Profil étudiant introuvable.');

        $studentAvg = round((float) (Grade::where('student_id', $student->id)->avg('value') ?? 13.5), 2);

        // Moyennes de la promotion pour estimer le rang en temps réel
        $cohortAverages = Grade::selectRaw('student_id, AVG(value) as avg_score')
            ->whereNotNull('value')
            ->groupBy('student_id')
            ->orderByDesc('avg_score')
            ->pluck('avg_score', 'student_id');

        $cohortSize = max(120, $cohortAverages->count());
        $betterCount = $cohortAverages->filter(fn ($score) => (float) $score > $studentAvg)->count();
        $estimatedRank = $betterCount + 1;

        $specialties = [
            ['code' => 'GFC', 'name' => 'Gestion Financière et Comptable', 'quota' => 85, 'cutoff_estimate' => 13.20],
            ['code' => 'ACG', 'name' => 'Audit et Contrôle de Gestion', 'quota' => 80, 'cutoff_estimate' => 13.60],
            ['code' => 'MCM', 'name' => 'Marketing et Commerce International / Action Commerciale', 'quota' => 75, 'cutoff_estimate' => 11.80],
            ['code' => 'CI',  'name' => 'Commerce International', 'quota' => 70, 'cutoff_estimate' => 12.50],
            ['code' => 'MRH', 'name' => 'Management des Ressources Humaines & Logistique', 'quota' => 60, 'cutoff_estimate' => 11.50],
        ];

        $wishCountsByFiliere = SpecialtyWish::where('preference_rank', 1)
            ->selectRaw('filiere_id, COUNT(*) as total')
            ->groupBy('filiere_id')
            ->pluck('total', 'filiere_id');

        $filiereCodesById = Filiere::whereIn('id', $wishCountsByFiliere->keys())
            ->pluck('code', 'id');

        $wishesByCode = [];
        foreach ($wishCountsByFiliere as $fId => $cnt) {
            if (isset($filiereCodesById[$fId])) {
                $wishesByCode[$filiereCodesById[$fId]] = (int) $cnt;
            }
        }

        $simulations = collect($specialties)->map(function (array $spec) use ($studentAvg, $estimatedRank, $wishesByCode) {
            $firstChoiceDemand = (int) ($wishesByCode[$spec['code']] ?? round($spec['quota'] * 0.85));
            $diff = $studentAvg - $spec['cutoff_estimate'];
            $probability = (int) max(15, min(99, round(70 + ($diff * 15))));

            $admissionStatus = $probability >= 75
                ? 'favorable'
                : ($probability >= 45 ? 'liste_attente_probable' : 'risque_eleve');

            return [
                'code' => $spec['code'],
                'name' => $spec['name'],
                'quota_places' => $spec['quota'],
                'current_first_choice_demand' => $firstChoiceDemand,
                'occupancy_rate_pct' => round(($firstChoiceDemand / max(1, $spec['quota'])) * 100, 1),
                'estimated_cutoff_gpa' => $spec['cutoff_estimate'],
                'student_simulated_rank' => min($spec['quota'] + 25, max(1, (int) round($estimatedRank * 0.35))),
                'admission_probability_pct' => $probability,
                'status' => $admissionStatus,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'student_id' => $student->id,
                'apogee_code' => $student->apogee_code ?? $student->student_number,
                'student_gpa' => $studentAvg,
                'cohort_rank' => $estimatedRank,
                'cohort_size' => $cohortSize,
                'percentile_top' => round(($estimatedRank / max(1, $cohortSize)) * 100, 1),
                'specialties_live_quota' => $simulations,
                'updated_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
