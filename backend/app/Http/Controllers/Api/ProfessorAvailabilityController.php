<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ProfessorAvailabilitySurveyMail;
use App\Models\AcademicYear;
use App\Models\Professor;
use App\Models\ProfessorAvailability;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ProfessorAvailabilityController extends Controller
{
    /**
     * Liste des disponibilités des professeurs.
     */
    public function index(): JsonResponse
    {
        $professorProfiles = Professor::with(['user', 'department'])->get();

        $academicYear = AcademicYear::where('is_current', true)->first();
        $academicYearId = $academicYear?->id ?? 1;

        $availabilities = ProfessorAvailability::where('academic_year_id', $academicYearId)
            ->get()
            ->keyBy('professor_id');

        $data = $professorProfiles->map(function ($profProfile) use ($availabilities) {
            $prof = $profProfile->user;
            if (! $prof) {
                return null;
            }

            $avail = $availabilities->get($prof->id);
            $departmentName = $profProfile->department->name ?? 'Inconnu';

            $days = [];
            if ($avail?->availability_data) {
                $days = json_decode($avail->availability_data, true) ?? [];
            }

            $creneauxText = $avail ? $avail->available_slots_count.' créneaux' : '-';
            if (! empty($days)) {
                $creneauxText = implode(', ', $days).' ('.$creneauxText.')';
            }

            $contrat = match ($profProfile->contract_type) {
                'vacataire' => 'Vacataire',
                'doctorant' => 'Doctorant',
                default => 'Permanent',
            };

            return [
                'id' => $prof->id,
                'nom' => $prof->name,
                'email' => $prof->email,
                'dept' => $departmentName,
                'contrat' => $contrat,
                'statut' => $avail?->status ?? 'Non envoyé',
                'creneaux' => $creneauxText,
                'date' => $avail?->updated_at?->format('d/m/Y H:i') ?? '-',
            ];
        })->filter();

        return response()->json([
            'success' => true,
            'data' => $data->values(),
        ]);
    }

    /**
     * Envoyer une alerte aux professeurs sélectionnés.
     */
    public function alert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_ids' => 'required|array',
            'professor_ids.*' => 'integer|exists:users,id',
        ]);

        $professors = User::whereIn('id', $validated['professor_ids'])->get();

        $academicYear = AcademicYear::where('is_current', true)->first();
        $academicYearName = $academicYear?->label ?? '2026/2027';

        foreach ($professors as $prof) {
            $profName = trim(($prof->first_name ?? '').' '.($prof->last_name ?? '')) ?: ($prof->name ?? 'Enseignant');
            Mail::to($prof->email)->send(new ProfessorAvailabilitySurveyMail([
                'professorName' => $profName,
                'name' => $profName,
                'sessionName' => 'Session d\'Examens '.$academicYearName,
                'session' => 'Session d\'Examens '.$academicYearName,
                'sessionType' => 'Normale / Rattrapage',
                'surveyUrl' => config('app.frontend_url', url('/')).'/professor/availability-survey',
                'link' => config('app.frontend_url', url('/')).'/professor/availability-survey',
                'deadline' => now()->addDays(7)->format('d/m/Y'),
            ]));

            ProfessorAvailability::updateOrCreate(
                ['professor_id' => $prof->id, 'academic_year_id' => $academicYear?->id ?? 1],
                ['status' => 'En attente', 'available_slots_count' => 0]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Sondage de disponibilité envoyé aux professeurs sélectionnés.',
        ]);
    }

    /**
     * Obtenir la disponibilité de l'enseignant connecté.
     */
    public function myAvailability(Request $request): JsonResponse
    {
        $user = $request->user();
        $profId = $user->professor?->id ?? $user->id;
        $academicYear = AcademicYear::where('is_current', true)->first();
        $academicYearId = $academicYear?->id ?? 1;

        $avail = ProfessorAvailability::where('professor_id', $profId)
            ->where('academic_year_id', $academicYearId)
            ->first();

        $slots = [
            'Lundi' => ['matin' => true, 'apresMidi' => true],
            'Mardi' => ['matin' => true, 'apresMidi' => true],
            'Mercredi' => ['matin' => true, 'apresMidi' => false],
            'Jeudi' => ['matin' => true, 'apresMidi' => true],
            'Vendredi' => ['matin' => false, 'apresMidi' => true],
            'Samedi' => ['matin' => false, 'apresMidi' => false],
        ];

        if ($avail && $avail->availability_data) {
            $decoded = json_decode($avail->availability_data, true);
            if (is_array($decoded)) {
                $slots = array_merge($slots, $decoded);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'availability' => $slots,
                'status' => $avail?->status ?? 'Soumis',
                'notes' => $avail?->notes ?? '',
                'updated_at' => $avail?->updated_at?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i'),
                'session_name' => 'Session d\'Automne '.($academicYear?->label ?? '2026/2027'),
            ],
        ]);
    }

    /**
     * Enregistrer la disponibilité de l'enseignant connecté.
     */
    public function saveMyAvailability(Request $request): JsonResponse
    {
        $user = $request->user();
        $profId = $user->professor?->id ?? $user->id;
        $academicYear = AcademicYear::where('is_current', true)->first();
        $academicYearId = $academicYear?->id ?? 1;

        $validated = $request->validate([
            'availability' => 'required|array',
            'notes' => 'nullable|string|max:1000',
        ]);

        $slotsCount = 0;
        foreach ($validated['availability'] as $day => $s) {
            if (! empty($s['matin'])) {
                $slotsCount++;
            }
            if (! empty($s['apresMidi'])) {
                $slotsCount++;
            }
        }

        $avail = ProfessorAvailability::updateOrCreate(
            [
                'professor_id' => $profId,
                'academic_year_id' => $academicYearId,
            ],
            [
                'availability_data' => json_encode($validated['availability']),
                'available_slots_count' => $slotsCount,
                'notes' => $validated['notes'] ?? null,
                'status' => 'Soumis',
                'updated_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Disponibilités enregistrées avec succès !',
            'data' => $avail,
        ]);
    }
}
