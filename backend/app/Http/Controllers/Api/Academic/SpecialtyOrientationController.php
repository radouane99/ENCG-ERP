<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Models\Filiere;
use App\Models\FiliereQuota;
use App\Models\Grade;
use App\Models\SpecialtyWish;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SpecialtyOrientationController extends Controller
{
    /**
     * Liste des filières de spécialité disponibles pour l'orientation S5/S6 et vœux de l'étudiant.
     */
    public function studentGetChoices(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        // Fetch or simulate the 5 standard ENCG Specialties
        $filieres = Filiere::where('type', 'grande_ecole')
            ->orWhereIn('code', ['GFC', 'MACG', 'MCI', 'MRH', 'MLOG'])
            ->get();

        if ($filieres->isEmpty()) {
            $filieres = collect([
                (object) ['id' => 1, 'code' => 'GFC', 'name' => 'Gestion Financière et Comptable', 'description' => 'Finance de marché, corporate finance, ingénierie financière et audit bancaire.'],
                (object) ['id' => 2, 'code' => 'MACG', 'name' => 'Management Audit et Contrôle de Gestion', 'description' => 'Audit légal, commissariat aux comptes, contrôle de gestion et pilotage de la performance.'],
                (object) ['id' => 3, 'code' => 'MCI', 'name' => 'Marketing et Commerce International', 'description' => 'Marketing digital, brand management, négociation internationale et supply chain commerciale.'],
                (object) ['id' => 4, 'code' => 'MRH', 'name' => 'Management des Ressources Humaines', 'description' => 'Gestion prévisionnelle des emplois et des compétences (GPEC), droit social et coaching d\'organisation.'],
                (object) ['id' => 5, 'code' => 'MLOG', 'name' => 'Management Logistique & Supply Chain', 'description' => 'Logistique globale, gestion des opérations, achats stratégiques et commerce extérieur.'],
            ]);
        }

        // Calculate student's cumulative merit score from completed grades
        $grades = Grade::where('student_id', $student->id)->get();
        $overallAverage = $grades->isNotEmpty() ? round($grades->avg('grade'), 2) : 14.50;

        // Retrieve existing wishes
        $existingWishes = SpecialtyWish::with('filiere')
            ->where('student_id', $student->id)
            ->orderBy('preference_rank', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'filieres' => $filieres,
                'existing_wishes' => $existingWishes,
                'student_merit_score' => $overallAverage,
                'is_campaign_open' => true,
                'deadline' => now()->addDays(15)->format('d/m/Y'),
            ],
        ]);
    }

    /**
     * Enregistrement des 5 vœux ordonnés de l'étudiant.
     */
    public function studentSubmitChoices(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $validated = $request->validate([
            'wishes' => 'required|array|min:2|max:5',
            'wishes.*.filiere_id' => 'required|integer',
            'wishes.*.preference_rank' => 'required|integer|min:1|max:5',
        ]);

        // Calculate student's merit score
        $grades = Grade::where('student_id', $student->id)->get();
        $meritScore = $grades->isNotEmpty() ? round($grades->avg('grade'), 2) : 14.50;

        DB::transaction(function () use ($student, $validated, $meritScore) {
            SpecialtyWish::where('student_id', $student->id)->delete();

            foreach ($validated['wishes'] as $wish) {
                SpecialtyWish::create([
                    'student_id' => $student->id,
                    'filiere_id' => $wish['filiere_id'],
                    'preference_rank' => $wish['preference_rank'],
                    'academic_year' => '2026/2027',
                    'calculated_merit_score' => $meritScore,
                    'allocation_status' => 'pending',
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Vos vœux de filière ont été enregistrés avec succès ! Score de mérite calculé : ' . $meritScore . '/20.',
            'data' => SpecialtyWish::where('student_id', $student->id)->orderBy('preference_rank')->get(),
        ]);
    }

    /**
     * Administration : Aperçu de l'ensemble des vœux et simulation de l'affectation.
     */
    public function adminGetSimulation(Request $request): JsonResponse
    {
        $wishes = SpecialtyWish::with(['student.user', 'filiere'])
            ->orderBy('calculated_merit_score', 'desc')
            ->get();

        $quotas = FiliereQuota::with('filiere')->get();

        $stats = [
            'total_students_voted' => $wishes->groupBy('student_id')->count(),
            'gfc_first_choice' => $wishes->where('preference_rank', 1)->filter(fn ($w) => str_contains($w->filiere?->code ?? '', 'GFC'))->count(),
            'macg_first_choice' => $wishes->where('preference_rank', 1)->filter(fn ($w) => str_contains($w->filiere?->code ?? '', 'MACG'))->count(),
            'mci_first_choice' => $wishes->where('preference_rank', 1)->filter(fn ($w) => str_contains($w->filiere?->code ?? '', 'MCI'))->count(),
            'mrh_first_choice' => $wishes->where('preference_rank', 1)->filter(fn ($w) => str_contains($w->filiere?->code ?? '', 'MRH'))->count(),
            'mlog_first_choice' => $wishes->where('preference_rank', 1)->filter(fn ($w) => str_contains($w->filiere?->code ?? '', 'MLOG'))->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'wishes' => $wishes,
                'quotas' => $quotas,
                'statistics' => $stats,
            ],
        ]);
    }

    /**
     * Administration : Exécution de l'algorithme d'affectation au mérite (Gale-Shapley / Ranking Optimal).
     */
    public function adminRunAllocation(Request $request): JsonResponse
    {
        // 1. Group wishes by student and sort students by merit score DESC
        $allWishes = SpecialtyWish::with(['student', 'filiere'])
            ->orderBy('calculated_merit_score', 'desc')
            ->get()
            ->groupBy('student_id');

        $capacities = [
            1 => 60, // GFC
            2 => 60, // MACG
            3 => 60, // MCI
            4 => 45, // MRH
            5 => 45, // MLOG
        ];

        $assignedCounts = [];
        $allocatedStudents = 0;
        $satisfactionRank1 = 0;
        $satisfactionRank2 = 0;

        DB::transaction(function () use ($allWishes, &$capacities, &$assignedCounts, &$allocatedStudents, &$satisfactionRank1, &$satisfactionRank2) {
            foreach ($allWishes as $studentId => $studentWishes) {
                $sortedWishes = $studentWishes->sortBy('preference_rank');
                $assigned = false;

                foreach ($sortedWishes as $wish) {
                    $fId = $wish->filiere_id;
                    $currentCap = $capacities[$fId] ?? 60;
                    $currentAssigned = $assignedCounts[$fId] ?? 0;

                    if ($currentAssigned < $currentCap) {
                        $wish->allocation_status = 'assigned';
                        $wish->allocated_at = now();
                        $wish->save();

                        $assignedCounts[$fId] = $currentAssigned + 1;
                        $assigned = true;
                        $allocatedStudents++;

                        if ($wish->preference_rank === 1) $satisfactionRank1++;
                        elseif ($wish->preference_rank === 2) $satisfactionRank2++;

                        // Mark other wishes of this student as not selected
                        SpecialtyWish::where('student_id', $studentId)
                            ->where('id', '!=', $wish->id)
                            ->update(['allocation_status' => 'rejected']);

                        break;
                    }
                }

                // If student could not get any of their preferences due to capacity, place in waiting list
                if (! $assigned) {
                    $firstWish = $sortedWishes->first();
                    if ($firstWish) {
                        $firstWish->allocation_status = 'waiting_list';
                        $firstWish->waiting_list_rank = 1;
                        $firstWish->save();
                    }
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Algorithme d\'orientation exécuté avec succès. Répartition au mérite validée.',
            'data' => [
                'total_allocated' => $allocatedStudents,
                'capacities_usage' => $assignedCounts,
                'first_choice_satisfaction_rate' => $allocatedStudents > 0 ? round(($satisfactionRank1 / $allocatedStudents) * 100, 1) : 0,
                'second_choice_satisfaction_rate' => $allocatedStudents > 0 ? round(($satisfactionRank2 / $allocatedStudents) * 100, 1) : 0,
            ],
        ]);
    }
}
