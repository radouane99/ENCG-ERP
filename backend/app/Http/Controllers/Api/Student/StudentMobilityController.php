<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StudentMobilityController extends Controller
{
    /**
     * Get the list of international partners available for mobility.
     */
    public function getPartners(): JsonResponse
    {
        $partners = [
            ['id' => 0, 'name' => 'KEDGE Business School', 'country' => 'France', 'city' => 'Bordeaux', 'type' => 'Double Diplôme', 'slots' => 5, 'gpaRequired' => '14.00'],
            ['id' => 1, 'name' => 'NEOMA Business School', 'country' => 'France', 'city' => 'Rouen', 'type' => 'Semestre d\'Échange', 'slots' => 8, 'gpaRequired' => '13.50'],
            ['id' => 2, 'name' => 'Université Laval', 'country' => 'Canada', 'city' => 'Québec', 'type' => 'Semestre d\'Échange', 'slots' => 3, 'gpaRequired' => '14.50'],
            ['id' => 3, 'name' => 'Kyung Hee University', 'country' => 'Corée du Sud', 'city' => 'Séoul', 'type' => 'Semestre d\'Échange', 'slots' => 2, 'gpaRequired' => '13.00'],
        ];

        // Retrieve current voeux from session or a simple cache mechanism for demo
        $voeux = session('mobility_voeux', []);

        return response()->json([
            'success' => true,
            'data' => [
                'partners' => $partners,
                'voeux' => $voeux
            ]
        ]);
    }

    /**
     * Save the student's choices (voeux) for mobility.
     */
    public function saveVoeux(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'voeux' => 'required|array|max:3',
            'voeux.*' => 'integer'
        ]);

        // In a real application, we would save this to the database (e.g. `mobility_choices` table).
        // For the sake of the demo, we will store it in the session.
        session(['mobility_voeux' => $validated['voeux']]);

        return response()->json([
            'success' => true,
            'message' => 'Vœux de mobilité enregistrés avec succès.',
            'data' => $validated['voeux']
        ]);
    }
}
