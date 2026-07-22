<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ProfessorAvailability;
use App\Models\User;

class ProfessorAvailabilityController extends Controller
{
    public function index(): JsonResponse
    {
        // Get all teaching staff using the Professor model to ensure we get permanent staff
        $professorProfiles = \App\Models\Professor::with(['user', 'department'])->get();
        
        $academicYear = \App\Models\AcademicYear::where('is_current', true)->first();
        $academicYearId = $academicYear ? $academicYear->id : 1;

        // Get their availabilities
        $availabilities = ProfessorAvailability::where('academic_year_id', $academicYearId)
            ->get()
            ->keyBy('professor_id');

        $data = $professorProfiles->map(function ($profProfile) use ($availabilities) {
            $prof = $profProfile->user;
            if (!$prof) return null;

            $avail = $availabilities->get($prof->id);
            $departmentName = $profProfile->department->name ?? 'Inconnu';
            
            $days = [];
            if ($avail && $avail->availability_data) {
                $days = json_decode($avail->availability_data, true) ?? [];
                if (isset($days['mock'])) $days = ['Lundi', 'Mardi', 'Jeudi']; // Fallback for old seeder
            }
            
            $creneauxText = $avail ? $avail->available_slots_count . ' créneaux' : '-';
            if (!empty($days)) {
                $creneauxText = implode(', ', $days) . ' (' . $creneauxText . ')';
            }

            $contrat = match($profProfile->contract_type) {
                'vacataire' => 'Vacataire',
                'doctorant' => 'Doctorant',
                default => 'Permanent'
            };

            return [
                'id' => $prof->id,
                'nom' => $prof->name,
                'email' => $prof->email,
                'dept' => $departmentName,
                'contrat' => $contrat,
                'statut' => $avail ? $avail->status : 'Non envoyé',
                'creneaux' => $creneauxText,
                'date' => $avail ? $avail->updated_at->format('d/m/Y H:i') : '-',
            ];
        })->filter();

        return response()->json([
            'success' => true,
            'data' => $data->values()
        ]);
    }

    public function alert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_ids' => 'required|array',
            'professor_ids.*' => 'integer|exists:users,id'
        ]);

        $professors = User::whereIn('id', $validated['professor_ids'])->get();
        
        $academicYear = \App\Models\AcademicYear::where('is_current', true)->first();
        $academicYearName = $academicYear ? $academicYear->label : '2026/2027';

        foreach ($professors as $prof) {
            $surveyData = [
                'name' => $prof->name,
                'session' => 'Session d\'Examens ' . $academicYearName,
                'link' => config('app.frontend_url', 'http://localhost:5173') . '/professor/availability-survey',
                'deadline' => now()->addDays(7)->format('d/m/Y')
            ];

            \Illuminate\Support\Facades\Mail::to($prof->email)
                ->send(new \App\Mail\ProfessorAvailabilitySurveyMail($surveyData));
                
            // Update status in ProfessorAvailability table
            \App\Models\ProfessorAvailability::updateOrCreate(
                ['professor_id' => $prof->id, 'academic_year_id' => $academicYear->id ?? 1],
                ['status' => 'En attente', 'available_slots_count' => 0]
            );
        }

        return response()->json([
            'success' => true,
            'message' => count($validated['professor_ids']) . ' professeurs ont été alertés avec succès.'
        ]);
    }
}
