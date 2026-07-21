<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\MobilityPartner;
use App\Models\Student;
use App\Models\StudentMobilityChoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentMobilityController extends Controller
{
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
            'data' => [
                'partners' => $partners,
                'voeux' => $voeux,
            ],
        ]);
    }

    public function saveVoeux(Request $request): JsonResponse
    {
        $student = $request->user()?->student;
        abort_unless($student, 403, 'Profil étudiant introuvable.');

        $validated = $request->validate([
            'voeux' => 'required|array|max:3',
            'voeux.*' => 'integer|distinct|exists:mobility_partners,id',
        ]);

        DB::transaction(function () use ($student, $validated) {
            StudentMobilityChoice::where('student_id', $student->id)->delete();

            foreach (array_values($validated['voeux']) as $index => $partnerId) {
                StudentMobilityChoice::create([
                    'student_id' => $student->id,
                    'mobility_partner_id' => $partnerId,
                    'choice_rank' => $index + 1,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Vœux de mobilité enregistrés avec succès.',
            'data' => $validated['voeux'],
        ]);
    }

    public function calculateMeritRanking(Request $request): JsonResponse
    {
        $students = Student::with('user')->take(50)->get();

        $rankedStudents = $students->map(function (Student $student) {
            $allGrades = Grade::where('student_id', $student->id)->get();
            $languageGrades = Grade::where('student_id', $student->id)
                ->whereHas('assessment.module', function ($query) {
                    $query->where('name', 'like', '%anglais%')
                        ->orWhere('name', 'like', '%français%')
                        ->orWhere('name', 'like', '%communication%')
                        ->orWhere('code', 'like', '%LANG%');
                })
                ->get();

            $gpaS1S6 = round((float) ($allGrades->avg('value') ?? 0), 2);
            $languageScore = round((float) ($languageGrades->avg('value') ?? 0), 2);
            $interviewScore = 0.0;
            $meritScore = round((0.6 * $gpaS1S6) + (0.2 * $languageScore) + (0.2 * $interviewScore), 2);

            $assignedPartner = MobilityPartner::where('is_active', true)
                ->where('gpa_required', '<=', $gpaS1S6)
                ->orderByDesc('gpa_required')
                ->value('name');

            return [
                'student_id' => $student->id,
                'name' => trim(($student->user->first_name ?? '') . ' ' . ($student->user->last_name ?? '')),
                'student_number' => $student->student_number ?? 'N/A',
                'gpa_s1_s6' => $gpaS1S6,
                'language_score' => $languageScore,
                'interview_score' => $interviewScore,
                'merit_score' => $meritScore,
                'assigned_partner' => $assignedPartner,
                'status' => $meritScore > 0 ? 'ADMISSIBLE' : 'EN_ATTENTE_DONNÉES',
            ];
        })->sortByDesc('merit_score')->values();

        return response()->json([
            'success' => true,
            'message' => 'Classement de mobilité calculé à partir des données disponibles en base.',
            'formula' => 'Score = (0.6 * GPA S1-S6) + (0.2 * Language/TOEIC) + (0.2 * Entretien)',
            'data' => $rankedStudents,
        ]);
    }
}
