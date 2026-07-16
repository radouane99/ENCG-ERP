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
        // Fetch all resit eligibilities with correct real relations
        $retakes = ResitEligibility::with(['student.user', 'module.filiere'])
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'student_id' => $item->student_id,
                    'nom' => $item->student->user->name ?? 'Inconnu',
                    'email' => $item->student->user->email ?? '',
                    'cne' => $item->student->cne ?? 'N/A',
                    'filiere' => $item->module->filiere->name ?? 'N/A',
                    'module' => $item->module->name ?? 'N/A',
                    'raison' => $item->reason,
                    'status' => $item->status ?? ($item->is_eligible ? 'Accordé' : 'En attente'),
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
