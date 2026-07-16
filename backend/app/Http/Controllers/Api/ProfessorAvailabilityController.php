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
        // Get all professors
        $professors = User::whereHas('roles', function($q) {
            $q->where('name', 'professor');
        })->get();

        $academicYear = \App\Models\AcademicYear::where('is_current', true)->first();
        $academicYearId = $academicYear ? $academicYear->id : 1;

        // Get their availabilities
        $availabilities = ProfessorAvailability::where('academic_year_id', $academicYearId)
            ->get()
            ->keyBy('professor_id');

        $data = $professors->map(function ($prof) use ($availabilities) {
            $avail = $availabilities->get($prof->id);
            return [
                'id' => $prof->id,
                'nom' => $prof->name,
                'email' => $prof->email,
                'dept' => $prof->department->name ?? 'Génie Informatique', // Uses department relation if available
                'contrat' => 'Permanent',
                'statut' => $avail ? $avail->status : 'Non envoyé',
                'creneaux' => $avail ? $avail->available_slots_count . ' créneaux' : '-',
                'date' => $avail ? $avail->updated_at->format('d/m/Y H:i') : '-',
            ];
        });

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

        // Logic to send email/notification to selected professors
        // ...

        return response()->json([
            'success' => true,
            'message' => count($validated['professor_ids']) . ' professeurs ont été alertés avec succès.'
        ]);
    }
}
