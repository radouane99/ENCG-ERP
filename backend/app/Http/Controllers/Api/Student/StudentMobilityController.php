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

        $partners = MobilityPartner::where(fn ($q) => $q->where('institution_id', $student->institution_id)->orWhereNull('institution_id'))->where('is_active', true)
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
                'gpaRequired' => (float) ($partner->gpa_required ?? 12.0),
                'gpa_required' => (float) ($partner->gpa_required ?? 12.0),
            ]);

        $voeux = StudentMobilityChoice::where('student_id', $student->id)
            ->where('academic_year_id', \App\Services\Academic\AcademicContext::yearId())
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

        \Illuminate\Support\Facades\DB::transaction(function () use ($student, $validated) {
            Student::whereKey($student->id)->lockForUpdate()->firstOrFail();
            $year = \App\Services\Academic\AcademicContext::yearId();
            abort_unless($year, 422, 'Aucune année active.');
            $partners = MobilityPartner::whereIn('id', $validated['voeux'])->where('is_active', true)->where(fn ($q) => $q->where('institution_id', $student->institution_id)->orWhereNull('institution_id'))->lockForUpdate()->get();
            abort_unless($partners->count() === count($validated['voeux']), 422, 'Un partenaire sélectionné est fermé ou indisponible.');
            StudentMobilityChoice::where('student_id', $student->id)->where('academic_year_id', $year)->delete();
            foreach (array_values($validated['voeux']) as $index => $partnerId) StudentMobilityChoice::create(['student_id' => $student->id, 'academic_year_id' => $year, 'mobility_partner_id' => $partnerId, 'choice_rank' => $index + 1]);
        });
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
        abort_unless($request->user()->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director', 'pedagogy_officer', 'scolarite']), 403);
        $year = \App\Services\Academic\AcademicContext::yearId(); abort_unless($year, 422, 'Année universitaire indisponible.');
        $partners = MobilityPartner::where('is_active', true)->where(fn ($q) => $q->where('institution_id', $request->user()->institution_id)->orWhereNull('institution_id'))->get()->keyBy('id');
        $students = Student::with('user')->where('institution_id', $request->user()->institution_id)->whereHas('mobilityChoices', fn ($q) => $q->where('academic_year_id', $year))->get();
        $choices = StudentMobilityChoice::where('academic_year_id', $year)->whereIn('student_id', $students->pluck('id'))->orderBy('choice_rank')->get()->groupBy('student_id');
        $ranked = $students->map(function ($student) use ($year, $choices) {
            $summary = app(\App\Services\Academic\AcademicMeritService::class)->summary($student, $year, 1, 6);
            return ['student_id' => $student->id, 'name' => $student->user->name, 'student_number' => $student->cne, 'academic_average' => $summary['average'], 'gpa_s1_s6' => $summary['average'], 'language_score' => $summary['language_average'], 'merit_score' => $summary['complete'] ? $summary['average'] : null, 'choices' => $choices[$student->id] ?? collect()];
        })->sort(fn ($a, $b) => (($b['merit_score'] ?? -1) <=> ($a['merit_score'] ?? -1)) ?: strcmp($a['student_number'], $b['student_number']) ?: ($a['student_id'] <=> $b['student_id']))->values();
        $used = []; $ranked = $ranked->map(function ($row, $index) use (&$used, $partners) {
            $partner = null;
            if ($row['merit_score'] !== null) foreach ($row['choices'] as $choice) {
                $candidate = $partners[$choice->mobility_partner_id] ?? null;
                if ($candidate && $row['merit_score'] >= $candidate->gpa_required && ($used[$candidate->id] ?? 0) < $candidate->slots) { $partner = $candidate; $used[$candidate->id] = ($used[$candidate->id] ?? 0) + 1; break; }
            }
            return array_diff_key($row, ['choices' => true]) + ['rank' => $index + 1, 'voeux' => $row['choices']->map(fn ($choice) => $partners[$choice->mobility_partner_id]->name ?? 'Partenaire fermé')->all(), 'proposed_partner' => $partner?->name, 'assigned_partner' => null, 'status' => $row['merit_score'] === null ? 'A_VERIFIER' : ($partner ? 'PROPOSITION' : 'LISTE_ATTENTE')];
        });
        $perPage = max(1, min(100, $request->integer('per_page', 25))); $page = max(1, $request->integer('page', 1));
        return response()->json(['success' => true, 'message' => 'Simulation indicative ; aucune affectation définitive enregistrée.', 'academic_year' => \App\Models\AcademicYear::find($year)->label,
            'formula' => 'Moyenne pondérée des modules documentés S1 à S6 de l’année sélectionnée, puis ordre des vœux et places disponibles.', 'data' => $ranked->forPage($page, $perPage)->values(), 'meta' => ['total' => $ranked->count(), 'per_page' => $perPage, 'current_page' => $page, 'last_page' => max(1, (int) ceil($ranked->count() / $perPage))]]);
    }
}
