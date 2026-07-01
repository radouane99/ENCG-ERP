<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ResitEligibility;

class RetakeController extends Controller
{
    public function index(): JsonResponse
    {
        // For the mock UI, we return all resit eligibilities with relations
        $retakes = ResitEligibility::with(['student.studentProfile', 'module'])
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'student_id' => $item->student_id,
                    'nom' => $item->student->name ?? 'Inconnu',
                    'email' => $item->student->email ?? '',
                    'cne' => optional($item->student->studentProfile)->cne ?? 'N/A',
                    'filiere' => 'Génie Informatique', // Mocked or fetched from relations
                    'module' => $item->module->name ?? 'N/A',
                    'raison' => $item->reason,
                    'status' => $item->status ?? ($item->is_eligible ? 'Accordé' : 'En attente'), // Depending on how we manage it
                    'date_decision' => $item->updated_at ? $item->updated_at->format('d/m/Y') : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $retakes
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:Accordé,Refusé'
        ]);

        $retake = ResitEligibility::findOrFail($id);
        
        // Use a dynamic property or if 'status' column is added later.
        // Assuming we add a 'status' column or interpret 'is_eligible'
        $retake->is_eligible = ($validated['status'] === 'Accordé');
        $retake->save();

        return response()->json([
            'success' => true,
            'message' => 'Statut du rattrapage mis à jour avec succès.',
            'status' => $validated['status']
        ]);
    }
}
