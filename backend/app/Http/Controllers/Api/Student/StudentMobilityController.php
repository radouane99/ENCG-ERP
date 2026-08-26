<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\MobilityPartner;
use App\Models\Student;
use App\Models\StudentMobilityChoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentMobilityController extends Controller
{
    /**
     * Partenaires de mobilité et vœux de l'étudiant.
     */
    public function getPartners(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        abort_unless($student, 403, 'Profil étudiant introuvable.');

        $partners = MobilityPartner::where('is_active', true)
            ->orderBy('country')
            ->orderBy('name')
            ->get()
            ->map(fn (MobilityPartner $partner) => [
                'id' => $partner->id,
                'name' => $partner->name,
                'country' => $partner->country,
                'city' => $partner->city,
                'type' => $partner->program_type,
                'slots' => $partner->slots,
                'gpaRequired' => number_format((float) $partner->gpa_required, 2, '.', ''),
            ]);

        $voeux = StudentMobilityChoice::where('student_id', $student->id)
            ->orderBy('choice_rank')
            ->pluck('mobility_partner_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        return response()->json([
            'success' => true,
            'data' => compact('partners', 'voeux'),
        ]);
    }

    /**
     * Enregistrer les vœux de mobilité.
     */
    public function saveVoeux(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        abort_unless($student, 403, 'Profil étudiant introuvable.');

        $validated = $request->validate([
            'voeux' => 'required|array|max:3',
            'voeux.*' => 'integer|distinct|exists:mobility_partners,id',
        ]);

        StudentMobilityChoice::where('student_id', $student->id)->delete();

        foreach (array_values($validated['voeux']) as $index => $partnerId) {
            StudentMobilityChoice::create([
                'student_id' => $student->id,
                'mobility_partner_id' => $partnerId,
                'choice_rank' => $index + 1,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Vœux de mobilité enregistrés avec succès.',
            'data' => $validated['voeux'],
        ]);
    }

    /**
     * Calculer le classement de mérite.
     */
    public function calculateMeritRanking(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Student::class);

        $perPage = min((int) $request->input('per_page', 50), 100);
        $students = Student::with(['user', 'grades.assessment.module'])
            ->orderBy('id')
            ->paginate($perPage);

        $rankedStudents = $students->getCollection()->map(function (Student $student) {
            $allGrades = $student->grades;
            $languageGrades = $allGrades->filter(fn ($g) => str_contains(strtolower($g->assessment->module->name ?? ''), 'anglais') ||
                str_contains(strtolower($g->assessment->module->name ?? ''), 'français') ||
                str_contains(strtolower($g->assessment->module->name ?? ''), 'communication') ||
                str_contains(strtolower($g->assessment->module->code ?? ''), 'LANG')
            );

            $gpaS1S6 = round((float) ($allGrades->avg('value') ?? 0), 2);
            $languageScore = round((float) ($languageGrades->avg('value') ?? 0), 2);
            $meritScore = round((0.6 * $gpaS1S6) + (0.2 * $languageScore), 2);

            $assignedPartner = MobilityPartner::where('is_active', true)
                ->where('gpa_required', '<=', $gpaS1S6)
                ->orderByDesc('gpa_required')
                ->value('name');

            return [
                'student_id' => $student->id,
                'name' => trim(($student->user->first_name ?? '').' '.($student->user->last_name ?? '')),
                'student_number' => $student->student_number ?? 'N/A',
                'gpa_s1_s6' => $gpaS1S6,
                'language_score' => $languageScore,
                'merit_score' => $meritScore,
                'assigned_partner' => $assignedPartner,
                'status' => $meritScore > 0 ? 'ADMISSIBLE' : 'EN_ATTENTE',
            ];
        })->sortByDesc('merit_score')->values();

        return response()->json([
            'success' => true,
            'message' => 'Classement de mobilité calculé.',
            'formula' => 'Score = (0.6 × GPA) + (0.2 × Langues)',
            'data' => $rankedStudents,
            'meta' => [
                'total' => $students->total(),
                'per_page' => $students->perPage(),
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
            ],
        ]);
    }
}
