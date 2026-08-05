<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Academic\StudentLifeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClubController extends Controller
{
    public function __construct(
        private StudentLifeService $studentLifeService
    ) {}

    /**
     * Liste des clubs.
     */
    public function index(): JsonResponse
    {
        $clubs = $this->studentLifeService->getAllClubs();

        return response()->json([
            'success' => true,
            'data'    => $clubs,
        ]);
    }

    /**
     * Créer un club.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'description'  => 'required|string',
            'president_id' => 'required|integer|exists:students,id',
            'logo_url'     => 'nullable|url',
        ]);

        $club = $this->studentLifeService->createClub($validated);

        return response()->json([
            'success' => true,
            'message' => 'Club créé et en attente de validation.',
            'data'    => $club,
        ], 201);
    }

    /**
     * Mettre à jour le statut d'un club.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if ($request->filled('status')) {
            try {
                $club = $this->studentLifeService->updateClubStatus($id, $request->status);

                return response()->json(['success' => true, 'data' => $club]);
            } catch (\Exception $e) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
            }
        }

        return response()->json(['success' => false, 'message' => 'Statut requis.'], 400);
    }
}